import { ExtensionContext, commands, window } from 'vscode';
import { RaidBar } from './manager';
import { initRaidBar } from './utils';
import { EXT_ROOT } from './contants';
import { RaidWebViewer } from './webview';
import { Timer } from './timer';
import { ExtCommands } from './contants';

export async function activate(context: ExtensionContext) {
	await initRaidBar(context.extensionUri);

	context.subscriptions.push(
		commands.registerCommand(ExtCommands.PAUSE_TIMER, () => {
			Timer.instance.pause();
		}),
		commands.registerCommand(ExtCommands.RESUME_TIMER, () => {
			Timer.instance.resume();
		}),
		commands.registerCommand(ExtCommands.OPEN_SESSION, async () => {
			if (!RaidBar.ready) {
				await initRaidBar(context.extensionUri);
				if (!RaidBar.ready) {
					window.showErrorMessage(`${EXT_ROOT}: Failed to start raidBar`);
					return;
				}
			}
			await RaidBar.instance.startShareSession();

			window.showInformationMessage('I just started a session');
		}),
		commands.registerCommand(ExtCommands.SEND_INVITE, () => {
			RaidBar.instance.inviteAndShare();
		}),
		commands.registerCommand(ExtCommands.BEGIN_SESSION, () => {
			RaidBar.instance.startRound();
		}),
		commands.registerCommand(ExtCommands.START_TIMER, () => {
			Timer.instance.start(15 * 1000);
		}),
		commands.registerCommand(ExtCommands.END_SESSION, async () => {
			window.showInformationMessage(`${EXT_ROOT}: I just ended a session`);
		}),
	);
}


export function deactivate() {
	RaidBar.instance.dispose();
	RaidWebViewer._instance?.dispose();
	Timer.instance.dispose();
}
