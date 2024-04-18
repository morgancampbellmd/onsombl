import { ExtensionContext } from 'vscode';
import { note } from './utils';
import { ext } from './module';

export async function activate(context: ExtensionContext) {
	await ext.init(context.extension.id);
	const Coordinator = ext.coordinator!;

	const pause = Coordinator.registerBroadcast(ext.cmd.PAUSE_TIMER, () => {
		ext.timer.pause();
	});

	const resume = Coordinator.registerBroadcast(ext.cmd.RESUME_TIMER, () => {
		ext.timer.resume();
	});

	const open = Coordinator.registerBroadcast(ext.cmd.OPEN_SESSION, async () => {
		await ext.manager.startShareSession();

		note.info('I just started a session');
   });

	const invite = Coordinator.registerBroadcast(ext.cmd.SEND_INVITE, () => {
		ext.manager.inviteAndShare();
	});

	const begin = Coordinator.registerBroadcast(ext.cmd.BEGIN_SESSION, () => {
		ext.manager.startRound();
	});

	const start = Coordinator.registerBroadcast(ext.cmd.START_TIMER, () => {
		ext.timer.start(15 * 1000);
	});

	const end = Coordinator.registerBroadcast(ext.cmd.END_SESSION, async () => {
		note.info('I just ended a session');
	});

	const rotate = Coordinator.registerBroadcast(ext.cmd.ROTATE_ACTIVE_USERS, () => {
		note.info('Rotating driver/navigator...');
	});

	context.subscriptions.push(
		pause, resume, open, invite, begin, start, end, rotate
	);
}


export function deactivate() {
}
