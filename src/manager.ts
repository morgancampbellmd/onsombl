import { StatusBarItem, window, StatusBarAlignment } from 'vscode';
import { LiveShare, Peer, Access } from 'vsls';
import { dispatchInviteEvent } from './utils';
import { Timer } from './timer';

export class Manager {
    constructor(
        private vsls: LiveShare,
        private timer: Timer
    ) {
    }

    peers: Peer[] = [];

    duration = 10 * 1000;

    private _navigatorBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    private _driverBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -2);


    disposables: { dispose(): void; }[] = [
        this._navigatorBar,
        this._driverBar,
    ];

    async inviteAndShare() {
        this.vsls.onDidChangeSession(async (sessionChangeEvent) => dispatchInviteEvent(sessionChangeEvent.session.id, sessionChangeEvent.session.user?.emailAddress));
        await this.startShareSession();
    }


    async startShareSession() {
        if (!this.vsls.session.id) {
            await this.vsls.share({
                access: Access.ReadWrite,
            });
        }
        this.timer.startRemoteListener();
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
        this.timer.start(this.duration);
    }


    endShareSession() {
        this.vsls.end();
    }

    dispose() {
        for (const resource of this.disposables) {
            resource.dispose();
        }
    }
}