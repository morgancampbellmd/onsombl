import { ExtensionContext, commands } from 'vscode';
import { note } from './utils';
import { ext } from './module';

export async function activate(context: ExtensionContext) {
	await ext.init(context.extension.id);

	const pause = ext.coordinator.registerCommand(ext.cmd.PAUSE_TIMER, () => {
		ext.timer.pause();
	});

	const resume = ext.coordinator.registerCommand(ext.cmd.RESUME_TIMER, () => {
		ext.timer.resume();
	});

	const open = commands.registerCommand(ext.cmd.OPEN_SESSION, async () => {
		await ext.manager.startShareSession();

		note.info('I just started a session');
   });

	const invite = ext.coordinator.registerCommand(ext.cmd.SEND_INVITE, () => {
		ext.manager.inviteAndShare();
	});

	const begin = ext.coordinator.registerCommand(ext.cmd.BEGIN_SESSION, () => {
		ext.manager.startRound();
	});

	const start = ext.coordinator.registerCommand(ext.cmd.START_TIMER, () => {
		ext.timer.start(15 * 1000);
	});

	const end = ext.coordinator.registerCommand(ext.cmd.END_SESSION, async () => {
		note.info('I just ended a session');
	});

	const rotate = ext.coordinator.registerCommand(ext.cmd.ROTATE_ACTIVE_USERS, () => {
		note.info('Rotating driver/navigator...');
	});

	context.subscriptions.push(
		pause, resume, open, invite, begin, start, end, rotate
	);
}


export function deactivate() {
	ext.dispose();
}
