import { ExtensionContext, commands, window } from 'vscode';
import { Manager } from './manager';
import { init } from './utils';
import { EXT_ROOT } from './contants';
import { RaidWebViewer } from './webview';
import { Timer } from './timer';
import { ExtCommands } from './contants';

export async function activate(context: ExtensionContext) {
	await init();

	const pause = commands.registerCommand(ExtCommands.PAUSE_TIMER, () => {
		Timer.instance.pause();
	});

	const resume = commands.registerCommand(ExtCommands.RESUME_TIMER, () => {
		Timer.instance.resume();
	});

	const open = commands.registerCommand(ExtCommands.OPEN_SESSION, async () => {

		await Manager.instance.startShareSession();

		window.showInformationMessage('I just started a session');
   });

	const invite = commands.registerCommand(ExtCommands.SEND_INVITE, () => {
		Manager.instance.inviteAndShare();
	});

	const begin = commands.registerCommand(ExtCommands.BEGIN_SESSION, () => {
		Manager.instance.startRound();
	});

	const start = commands.registerCommand(ExtCommands.START_TIMER, () => {
		Timer.instance.start(15 * 1000);
	});

	const end = commands.registerCommand(ExtCommands.END_SESSION, async () => {
		window.showInformationMessage(`${EXT_ROOT}: I just ended a session`);
	});

	context.subscriptions.push(
		pause, resume, open, invite, begin, start, end
	);
}


export function deactivate() {
	Manager.instance.dispose();
	RaidWebViewer._instance?.dispose();
	Timer.instance.dispose();
}
