import { Disposable, Uri, ViewColumn, WebviewPanel, WebviewPanelOnDidChangeViewStateEvent, window } from 'vscode';


export class RaidWebViewer {
	public static _instance: RaidWebViewer | undefined;
	public static readonly viewId = 'raidPanel';
	public static createOrShow(extensionUri: Uri): RaidWebViewer {
		const column = window.activeTextEditor?.viewColumn;

		if (RaidWebViewer._instance) {
			RaidWebViewer._instance._panel.reveal(column);
		} else {
      const panel = window.createWebviewPanel(
        RaidWebViewer.viewId,
        'Raid',
        column || ViewColumn.Active
      );
      RaidWebViewer._instance = new RaidWebViewer(panel, extensionUri);
    }

    return RaidWebViewer._instance;
	}

	private _disposables: Disposable[] = [];

  private _panel: WebviewPanel;
  private _extensionUri: Uri;


	private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

		this._panel.onDidDispose(this.dispose.bind(this), null, this._disposables);
		this._panel.onDidChangeViewState(this.changeViewHandler.bind(this), null, this._disposables);
		this._panel.webview.onDidReceiveMessage(this.webviewMessageHandler, null, this._disposables);
	}

  open(
    template: {
      filename: string,
    },
    contextData?: any
  ) {
    // const templateRef = this._nj.getTemplate(template.filename);

    // this._panel.webview.html = templateRef.render(contextData);
    // this._panel.title = template.title;
    this._panel.reveal();
  }


  webviewMessageHandler(message: any) {
    console.log('Webview message handler');

    switch (message.command) {
      case 'alert':
        window.showErrorMessage(message.text);
        return;
    }
  }

  changeViewHandler(event: WebviewPanelOnDidChangeViewStateEvent) {
    console.log('Change view handler');

    if (this._panel.visible) {
      this._panel.webview.html;
    }
  }

	sendMessage() {
		this._panel.webview.postMessage({ command: 'refactor' });
	}


  getViewUri(filename?: string) {
    return Uri.joinPath(this._extensionUri, ...['views', filename || []].flat());
  }


	dispose() {
		RaidWebViewer._instance = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const item = this._disposables.pop();
			if (item) item.dispose();
		}
	}
}
