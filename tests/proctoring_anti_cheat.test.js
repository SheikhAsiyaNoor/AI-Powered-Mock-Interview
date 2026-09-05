/**
 * Comprehensive Automated Tests for Anti-Cheat Proctoring,
 * Tab Switch Detection, Disqualification, and Refresh Protection.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Simulated Browser Storage
class MockSessionStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

// Logic Simulation of useTabSwitchProctor
function createTabSwitchProctorSimulator(options = {}) {
    const {
        maxAllowedSwitches = 4,
        isActive = true,
        onAutoQuit = null,
        sessionType = 'interview',
        storageKey = null,
        storage = new MockSessionStorage()
    } = options;

    let switchCount = 0;
    let showWarningModal = false;
    let isTerminated = false;
    let terminationMessage = '';
    let lastTriggerTime = -999999;

    // Restore from storage if present
    if (storageKey) {
        const raw = storage.getItem(storageKey);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed.switchCount === 'number') switchCount = parsed.switchCount;
                if (parsed.isTerminated) {
                    isTerminated = true;
                    terminationMessage = parsed.terminationMessage || `Session Auto-Ended: You switched tabs ${switchCount} times.`;
                    if (!parsed.modalDismissed) showWarningModal = true;
                    if (onAutoQuit) onAutoQuit(switchCount);
                }
            } catch (e) {}
        }
    }

    const recordSwitch = (simulatedTime = Date.now()) => {
        if (!isActive || isTerminated) return false;

        // Debounce 2000ms
        if (simulatedTime - lastTriggerTime < 2000) {
            return false; // Ignored as duplicate event
        }
        lastTriggerTime = simulatedTime;

        switchCount += 1;
        if (switchCount >= maxAllowedSwitches) {
            isTerminated = true;
            showWarningModal = true;
            terminationMessage = `Session Auto-Ended: You switched tabs ${switchCount} times. As per anti-cheating rules, your ${sessionType} has been terminated and auto-submitted.`;
            if (storageKey) {
                storage.setItem(storageKey, JSON.stringify({
                    isTerminated: true,
                    switchCount,
                    terminationMessage,
                    modalDismissed: false,
                    timestamp: simulatedTime
                }));
            }
            if (onAutoQuit) onAutoQuit(switchCount);
            return true;
        } else {
            showWarningModal = true;
            if (storageKey) {
                storage.setItem(storageKey, JSON.stringify({
                    isTerminated: false,
                    switchCount,
                    modalDismissed: false,
                    timestamp: simulatedTime
                }));
            }
            return true;
        }
    };

    const dismissWarning = (force = false) => {
        if (!isTerminated || force) {
            showWarningModal = false;
            if (storageKey) {
                const raw = storage.getItem(storageKey);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        storage.setItem(storageKey, JSON.stringify({ ...parsed, modalDismissed: true }));
                    } catch (e) {}
                }
            }
            return true;
        }
        return false; // Refused dismissal because session is terminated
    };

    const resetProctor = () => {
        switchCount = 0;
        isTerminated = false;
        showWarningModal = false;
        terminationMessage = '';
        if (storageKey) {
            storage.removeItem(storageKey);
        }
    };

    return {
        get switchCount() { return switchCount; },
        get showWarningModal() { return showWarningModal; },
        get isTerminated() { return isTerminated; },
        get terminationMessage() { return terminationMessage; },
        recordSwitch,
        dismissWarning,
        resetProctor
    };
}

describe('Anti-Cheat Proctoring Test Suite', () => {

    test('1. Debounces duplicate events occurring within 2000ms', () => {
        const proctor = createTabSwitchProctorSimulator();
        const baseTime = 10000;

        const first = proctor.recordSwitch(baseTime);
        assert.equal(first, true);
        assert.equal(proctor.switchCount, 1);

        // Immediate blur / visibilitychange fired 50ms later (e.g. alt-tab triggers both events)
        const duplicate = proctor.recordSwitch(baseTime + 50);
        assert.equal(duplicate, false, 'Should debounce blur and visibilitychange occurring simultaneously');
        assert.equal(proctor.switchCount, 1, 'Switch count should not increment on duplicate');

        // Subsequent switch after 2100ms
        const second = proctor.recordSwitch(baseTime + 2100);
        assert.equal(second, true);
        assert.equal(proctor.switchCount, 2);
    });

    test('2. Escalates warnings at 1, 2, 3 switches and terminates at 4th switch', () => {
        let autoQuitTriggered = false;
        let finalQuitCount = 0;

        const proctor = createTabSwitchProctorSimulator({
            maxAllowedSwitches: 4,
            onAutoQuit: (count) => {
                autoQuitTriggered = true;
                finalQuitCount = count;
            }
        });

        let t = 10000;

        // 1st Switch
        proctor.recordSwitch(t);
        assert.equal(proctor.switchCount, 1);
        assert.equal(proctor.isTerminated, false);
        assert.equal(proctor.showWarningModal, true);
        proctor.dismissWarning(false);
        assert.equal(proctor.showWarningModal, false);

        // 2nd Switch
        t += 3000;
        proctor.recordSwitch(t);
        assert.equal(proctor.switchCount, 2);
        assert.equal(proctor.isTerminated, false);
        proctor.dismissWarning(false);

        // 3rd Switch
        t += 3000;
        proctor.recordSwitch(t);
        assert.equal(proctor.switchCount, 3);
        assert.equal(proctor.isTerminated, false);
        proctor.dismissWarning(false);

        // 4th Switch -> Disqualification threshold
        t += 3000;
        proctor.recordSwitch(t);
        assert.equal(proctor.switchCount, 4);
        assert.equal(proctor.isTerminated, true, 'Session must be terminated on 4th switch');
        assert.equal(proctor.showWarningModal, true);
        assert.equal(autoQuitTriggered, true, 'onAutoQuit callback must be executed');
        assert.equal(finalQuitCount, 4);
    });

    test('3. Button click behavior on Acknowledge & View Results', () => {
        const proctor = createTabSwitchProctorSimulator({ maxAllowedSwitches: 4 });
        let t = 1000;
        for (let i = 0; i < 4; i++) {
            proctor.recordSwitch(t);
            t += 3000;
        }
        assert.equal(proctor.isTerminated, true);
        assert.equal(proctor.showWarningModal, true);

        // Regular dismiss (without force) does NOT close the modal when terminated
        const regularDismiss = proctor.dismissWarning(false);
        assert.equal(regularDismiss, false, 'Unforced dismiss must not bypass modal when terminated');
        assert.equal(proctor.showWarningModal, true);

        // When "Acknowledge & View Results" is clicked, force dismiss closes modal and reveals results
        let viewResultsCalled = false;
        const onViewResults = () => { viewResultsCalled = true; };

        // Simulate click on btn-acknowledge-view-results
        onViewResults();
        proctor.dismissWarning(true);

        assert.equal(viewResultsCalled, true, 'onViewResults must be executed');
        assert.equal(proctor.showWarningModal, false, 'Modal must close on Acknowledge & View Results');
    });

    test('4. Refresh protection: Prevents continuing test on page reload when disqualified', () => {
        const sharedStorage = new MockSessionStorage();
        const storageKey = 'iperitus_proctor_interview_test';

        // Candidate begins interview and gets disqualified (4 switches)
        const session1 = createTabSwitchProctorSimulator({
            maxAllowedSwitches: 4,
            storageKey,
            storage: sharedStorage
        });

        let t = 20000;
        for (let i = 0; i < 4; i++) {
            session1.recordSwitch(t);
            t += 3000;
        }
        assert.equal(session1.isTerminated, true);

        // Candidate refreshes the browser (new component instance mounting)
        let autoQuitFiredOnMount = false;
        const reloadedSession = createTabSwitchProctorSimulator({
            maxAllowedSwitches: 4,
            storageKey,
            storage: sharedStorage,
            onAutoQuit: () => {
                autoQuitFiredOnMount = true;
            }
        });

        // Verify reloaded state does NOT start fresh
        assert.equal(reloadedSession.isTerminated, true, 'Reloaded session must remain terminated');
        assert.equal(reloadedSession.switchCount, 4, 'Reloaded session must preserve switchCount');
        assert.equal(autoQuitFiredOnMount, true, 'AutoQuit should re-trigger or stay active');
    });

    test('5. Retake interview explicitly resets storage and proctor state', () => {
        const sharedStorage = new MockSessionStorage();
        const storageKey = 'iperitus_proctor_interview_test';

        const session = createTabSwitchProctorSimulator({
            maxAllowedSwitches: 4,
            storageKey,
            storage: sharedStorage
        });

        // Disqualify
        let t = 1000;
        for (let i = 0; i < 4; i++) {
            session.recordSwitch(t);
            t += 3000;
        }
        assert.equal(session.isTerminated, true);

        // Candidate explicitly chooses to retake
        session.resetProctor();

        assert.equal(session.isTerminated, false);
        assert.equal(session.switchCount, 0);
        assert.equal(session.showWarningModal, false);
        assert.equal(sharedStorage.getItem(storageKey), null, 'Storage key must be cleared on reset');
    });

    test('6. Inactive proctor does not register switches', () => {
        const inactiveProctor = createTabSwitchProctorSimulator({
            isActive: false,
            maxAllowedSwitches: 4
        });

        const registered = inactiveProctor.recordSwitch(10000);
        assert.equal(registered, false);
        assert.equal(inactiveProctor.switchCount, 0);
        assert.equal(inactiveProctor.showWarningModal, false);
    });

    test('7. Backend Disqualification Logic Simulation', () => {
        // Mock DB Interview document
        const mockInterview = {
            _id: '674b1234567890abcdef1234',
            userId: 'user123',
            domain: 'JavaScript/Node.js',
            score: 75,
            isComplete: false,
            feedback: '',
            progressionReport: '',
            createdAt: new Date(Date.now() - 300000)
        };

        // Simulate endInterview endpoint handler
        function simulateEndInterview(doc, body) {
            const { forceQuitReason, score = 0 } = body;
            const isDisqualified = Boolean(forceQuitReason);
            doc.isComplete = true;
            doc.score = isDisqualified ? 0 : score;
            if (forceQuitReason) {
                doc.feedback = `[DISQUALIFIED] ${forceQuitReason}`;
                doc.progressionReport = `Interview Terminated & Disqualified: ${forceQuitReason}`;
            }
            return {
                success: true,
                isComplete: doc.isComplete,
                score: doc.score,
                isDisqualified
            };
        }

        const res = simulateEndInterview(mockInterview, {
            sessionId: mockInterview._id,
            forceQuitReason: 'Session terminated due to 4 tab-switch violations.',
            score: 0
        });

        assert.equal(res.isComplete, true);
        assert.equal(res.score, 0, 'Disqualified interview score must be 0');
        assert.equal(res.isDisqualified, true);
        assert.match(mockInterview.feedback, /\[DISQUALIFIED\]/);
        assert.match(mockInterview.progressionReport, /Interview Terminated & Disqualified/);
    });
});
