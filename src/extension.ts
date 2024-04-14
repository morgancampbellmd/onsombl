import { ExtensionContext, commands } from 'vscode';
import { init, note } from './utils';
import { ExtCommands } from './constants';

export async function activate(context: ExtensionContext) {
	const module = await init(context.extension.id);
	const Timer = module.Timer!;
	const Manager = module.Manager!;
	const Coordinator = module.Coordinator!;

	const pause = Coordinator.registerBroadcast(ExtCommands.PAUSE_TIMER, () => {
		Timer.pause();
	});

	const resume = Coordinator.registerBroadcast(ExtCommands.RESUME_TIMER, () => {
		Timer.resume();
	});

	const open = Coordinator.registerBroadcast(ExtCommands.OPEN_SESSION, async () => {
		await Manager.startShareSession();

		note.info('I just started a session');
   });

	const invite = Coordinator.registerBroadcast(ExtCommands.SEND_INVITE, () => {
		Manager.inviteAndShare();
	});

	const begin = Coordinator.registerBroadcast(ExtCommands.BEGIN_SESSION, () => {
		Manager.startRound();
	});

	const start = Coordinator.registerBroadcast(ExtCommands.START_TIMER, () => {
		Timer.start(15 * 1000);
	});

	const end = Coordinator.registerBroadcast(ExtCommands.END_SESSION, async () => {
		note.info('I just ended a session');
	});

	const rotate = Coordinator.registerBroadcast(ExtCommands.ROTATE_ACTIVE_USERS, () => {
		note.info('Rotating driver/navigator...');
	});

	context.subscriptions.push(
		pause, resume, open, invite, begin, start, end, rotate
	);
}


export function deactivate() {
}
