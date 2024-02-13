import { ExtensionContext, commands } from 'vscode';
import { init, note } from './utils';
import { ExtCommands } from './constants';

export async function activate(context: ExtensionContext) {
	const module = await init();
	const Timer = module.Timer!;
	const Manager = module.Manager!;

	const pause = commands.registerCommand(ExtCommands.PAUSE_TIMER, () => {
		Timer.pause();
	});

	const resume = commands.registerCommand(ExtCommands.RESUME_TIMER, () => {
		Timer.resume();
	});

	const open = commands.registerCommand(ExtCommands.OPEN_SESSION, async () => {
		await Manager.startShareSession();

		note.info('I just started a session');
   });

	const invite = commands.registerCommand(ExtCommands.SEND_INVITE, () => {
		Manager.inviteAndShare();
	});

	const begin = commands.registerCommand(ExtCommands.BEGIN_SESSION, () => {
		Manager.startRound();
	});

	const start = commands.registerCommand(ExtCommands.START_TIMER, () => {
		Timer.start(15 * 1000);
	});

	const end = commands.registerCommand(ExtCommands.END_SESSION, async () => {
		note.info('I just ended a session');
	});

	context.subscriptions.push(
		pause, resume, open, invite, begin, start, end
	);
}


export function deactivate() {
}
