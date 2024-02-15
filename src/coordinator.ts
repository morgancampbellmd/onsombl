import { LiveShare, SharedService, SharedServiceProxy } from 'vsls';


export class Coordinator {
  readonly _vsls: LiveShare;
  host?: SharedService | null;
  guest?: SharedServiceProxy | null;

  constructor (vsls: LiveShare) {
    this._vsls = vsls;
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
  
  
}