import { StatusBarItem, window, StatusBarAlignment, Disposable } from 'vscode';
import { LiveShare, Peer, Access } from 'vsls';
import { Timer } from './timer';
import { Coordinator } from './coordinator';

export class Manager {
    readonly _navigatorBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    readonly _driverBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -2);

    constructor(
        private readonly _vsls: LiveShare,
        private readonly _timer: Timer,
        private readonly _coordinator: Coordinator
    ) {
    }

    peers: Peer[] = [];

    duration = 10 * 1000;

    disposables: Disposable[] = [
        this._navigatorBar,
        this._driverBar
    ];

    async inviteAndShare() {
        // this._vsls.onDidChangeSession((sessionChangeEvent) => dispatchInvite(sessionChangeEvent.session.id, sessionChangeEvent.session.user?.emailAddress ?? null))

        await this.startShareSession();
    }


    async startShareSession() {
        if (!this._vsls.session.id) {
            await this._vsls.share({
                access: Access.ReadWrite
            });
        }
        

        await this._coordinator.initService(this._vsls.session.role);
        // wait for people to join...
        // - setup onjoin listener

        this.openSettingsPage();
    }

    openRotationPage() {
        // this.webview.open(TEMPLATE_DATA.roundInfo);
    }


    // - show settings menu [actions: [start button, lock roster, assign roles, re-roll roles]]
    openSettingsPage() {
        // this.webview.open(TEMPLATE_DATA.settings);
    }

    startRound() {
        // Set Driver & Navigator
        //
        // Start timer
        this._timer.start(this.duration);
    }


    endShareSession() {
        this._vsls.end();
    }

    dispose() {
        for (const resource of this.disposables) {
            resource.dispose();
        }
    }
}