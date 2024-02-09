import { StatusBarItem, window, StatusBarAlignment } from 'vscode';
import { LiveShare, Peer, Access } from 'vsls';
import { dispatchInviteEvent } from './utils';
import { Timer } from './timer';

export class RaidBar {
    private static _instance: RaidBar | undefined;

    static init(vsls: LiveShare) {
        this._instance = new RaidBar(vsls);
    }

    static get instance() {
        if (!this._instance) {
            throw new TypeError('Cannot read RaidBar instance before it has been initialized');
        }
        return this._instance;
    }

    static get ready() {
        return !!this._instance;
    }

    private constructor(
        private vsls: LiveShare,
    ) {}

    timerBar = Timer.instance;
    peers: Peer[] = [];

    duration = 10 * 1000;

    private navigatorBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    private driverBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -2);


    disposables: { dispose(): void }[] = [
        this.navigatorBar,
        this.driverBar,
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
        this.timerBar.start(this.duration);
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