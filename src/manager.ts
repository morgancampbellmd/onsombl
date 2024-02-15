import { StatusBarItem, window, StatusBarAlignment, Disposable } from 'vscode';
import { LiveShare, Peer, Access, SharedService, SharedServiceProxy } from 'vsls';
import { Timer } from './timer';
import { ServiceName } from './constants';



function dispatchInvite(id: string | null, hostEmail: string | null) {

}

export class Manager {
    readonly _vsls: LiveShare;
    readonly _timer: Timer;
    readonly _navigatorBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -1);
    readonly _driverBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -2);

    constructor(
        vsls: LiveShare, timer: Timer
    ) {
        this._vsls = vsls;
        this._timer = timer;


    }

    peers: Peer[] = [];

    duration = 10 * 1000;


    host?: SharedService | null;
    guest?: SharedServiceProxy | null;

    disposables: Disposable[] = [
        this._navigatorBar,
        this._driverBar,
    ];

    async inviteAndShare() {
        this._vsls.onDidChangeSession((sessionChangeEvent) => dispatchInvite(sessionChangeEvent.session.id, sessionChangeEvent.session.user?.emailAddress ?? null));
        await this.startShareSession();
    }


    async startShareSession() {
        if (!this._vsls.session.id) {
            await this._vsls.share({
                access: Access.ReadWrite,
            });
        }

        this.host = await this._vsls.shareService(ServiceName.COORDINATOR);

        // wait for people to join...
        // - setup onjoin listener

        this.openSettingsPage();
    }

    async joinShareSession() {
        // get input code/url (via ext api maybe?)

        this.guest = await this._vsls.getSharedService(ServiceName.COORDINATOR);
        this.guest?.onDidChangeIsServiceAvailable((event) => {

        })
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