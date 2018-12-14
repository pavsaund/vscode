/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Dolittle. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnDolittleCliCommand, runDolittleCliCommandThroughIntegratedTerminal } from "./cli";
import globals from "./globals";
import { BoundedContextNodeProvider } from "./Explorer/BoundedContextNodeProvider";

const vscode = globals.vscode;
const project = require('./Project/Project');

/**
 * @param {import("vscode").ExtensionContext} context
 */
function activate(context) {
    process.addListener('unhandledRejection', (reason) => {
        console.error('Rejection not handled', reason);
    });
    process.addListener('uncaughtException', (error) => {
        console.error('Uncaught exception', error);
    });
    registerDolittleProjectCommands(context);
    registerDolittleArtifactsCommands(context);
    vscode.commands.registerCommand('dolittle.loadView', async () => {
        await ensureProjectConfiguration(true)
        .then(
            success => {
                vscode.window.createTreeView('features', {treeDataProvider: new BoundedContextNodeProvider(globals.projectConfiguration)});
            },
            error => vscode.window.showErrorMessage(`Failed to load dolittle projects.\nError: ${error}`)
        );
        
    });
}
function ensureProjectConfiguration(refresh) {
    if (globals.projectConfiguration === null || refresh === true) {
        globals.dolittleProjectOutputChannel.appendLine('Attempting to load dolittle project');
        return globals.setProjectConfiguration();
    }
    else return Promise.resolve();
}
/**
 * Executes a function that needs to be ran in a project configuration context
 *
 * @param {() => void} todo
 */
function executeInContext(todo) {
    return ensureProjectConfiguration()
        .then(
            success => todo(),
            error => {
                vscode.window.showErrorMessage(`Failed to load dolittle projects.\nError: ${error}`);
                throw error;
            }
        );
}

function registerDolittleProjectCommands(context) {
    vscode.commands.registerCommand('dolittle.newDolittleProject', async () => {
        try {
            let applicationUris = await vscode.workspace.findFiles('**/application.json', '**/node_modules/**', 2);
            if (applicationUris.length > 0) {
                globals.dolittleProjectOutputChannel.appendLine(`Found application.json files at paths ${applicationUris.map(uri => uri.fsPath).join(', ')}`);
                throw 'Could not start new dolittle project because there already exists a dolittle application here!';
            }
            await vscode.commands.executeCommand('dolittle.createApplication');
            await vscode.commands.executeCommand('dolittle.createBoundedContext');
        } catch (error){
            vscode.window.showErrorMessage('Could not create a new dolittle project');
            globals.dolittleProjectOutputChannel.appendLine(`Could not create a new dolittle project.\nError: ${error}`);
        }
    });
    vscode.commands.registerCommand('dolittle.reloadProject', async () => {
        await ensureProjectConfiguration(true)
            .then(
                success => {},
                error => vscode.window.showErrorMessage(`Failed to load dolittle projects.\nError: ${error}`)
            );
    });

    vscode.commands.registerTextEditorCommand('dolittle.build', async textEditor => {
       await executeInContext(() => project.build(textEditor.document.uri))
            .then(
                success => {},
                error => {
                    const msg = 'Could not build project';
                    vscode.window.showErrorMessage(msg);
                    globals.dolittleProjectOutputChannel.appendLine(msg);
                }
            );
    });
    vscode.commands.registerTextEditorCommand('dolittle.buildCurrent', async textEditor => {
        await executeInContext( () => project.buildCurrent(textEditor.document.uri))
            .then(
                success => {},
                error => {
                    const msg = 'Could not build current project';
                    vscode.window.showErrorMessage(msg);
                    globals.dolittleProjectOutputChannel.appendLine(msg);
                }
            );
    });

    vscode.commands.registerTextEditorCommand('dolittle.restore', async textEditor => {
        await executeInContext( () => project.restore(textEditor.document.uri))
            .then(
                success => {},
                error => {
                    vscode.window.showErrorMessage('Could not perform a project restore');
                    globals.dolittleProjectOutputChannel.appendLine('Could not perform project restore');
                }
            );
    });

    vscode.commands.registerTextEditorCommand('dolittle.test', async textEditor => {
        await executeInContext( () => project.test(textEditor.document.uri))
            .then(
                success => {},
                error => {
                    const msg = 'Could not perform tests';
                    vscode.window.showErrorMessage(msg);
                    globals.dolittleProjectOutputChannel.appendLine(msg);
                }
            );
    });
    vscode.commands.registerTextEditorCommand('dolittle.testDebug', async textEditor => {
        await executeInContext( () => project.testDebug(textEditor.document.uri))
            .then(
                success => {},
                error => {
                    const msg = 'Could not debug tests';
                    vscode.window.showErrorMessage(msg);
                    globals.dolittleProjectOutputChannel.appendLine(msg);
                }
            );
    });
    vscode.commands.registerTextEditorCommand('dolittle.testRerun', async textEditor => {
        await executeInContext( () => project.testRerun(textEditor.document.uri))
        .then(
            success => {},
            error => {
                const msg = 'Could not rerun tests';
                vscode.window.showErrorMessage(msg);
                globals.dolittleProjectOutputChannel.appendLine(msg);
            }
        );
    });
    
    vscode.commands.registerCommand('dolittle.createApplication', async () => {
        try {
            const applicationName = await vscode.window.showInputBox({prompt: 'Application name', ignoreFocusOut: true});
            globals.dolittleOutputChannel.appendLine('Creating application');
            spawnDolittleCliCommand(
                ['create', 'application'], 
                [applicationName], 
                {cwd: vscode.workspace.workspaceFolders[0].uri.fsPath}
            ).on('close', (code => {
                if (code !== 0) throw 'Could not create application';
                globals.dolittleOutputChannel.appendLine(`Created application '${applicationName}'`);
            }));
        } catch(err) {
            globals.dolittleProjectOutputChannel.appendLine(`Could not create application.\nError: ${err}`);
            vscode.window.showErrorMessage('Could not create application');
        }    
    });
    vscode.commands.registerCommand('dolittle.createBoundedContext', async () => {
        try {
            const boundedContextName = await vscode.window.showInputBox({prompt: 'Bounded Context name', ignoreFocusOut: true});
            globals.dolittleOutputChannel.appendLine('Creating bounded context');
            spawnDolittleCliCommand(
                ['create', 'boundedcontext'], 
                [boundedContextName], 
                {cwd: vscode.workspace.workspaceFolders[0].uri.fsPath}
            ).on('close', (code => {
                if (code !== 0) throw 'Could not create bounded context';
                globals.dolittleOutputChannel.appendLine(`Created bounded context '${boundedContextName}'`);
            }));
        } catch(err) {
            globals.dolittleProjectOutputChannel.appendLine(`Could not create bounded context.\nError: ${err}`);
            vscode.window.showErrorMessage('Could not create bounded context', err);
        }
    });
}

function registerDolittleArtifactsCommands(context) {
    const path = require('path');
    const artifacts = [
        'Command',
        'Event',
        'Read Model',
        'Aggregate Root',
        'Command Handler',
        'Query',
        'Event Processor',
        'Concept'
    ]
    vscode.commands.registerTextEditorCommand('dolittle.addArtifact', async (editor) => {
        try {
            const pick = await vscode.window.showQuickPick(artifacts, {canPickMany: false, ignoreFocusOut: true});
            let command = ['add'];
            switch (pick) {
                case 'Command':
                    command.push('command');
                    break;
                case 'Event':
                    command.push('event');
                    break;
                case 'Read Model':
                    command.push('readmodel');
                    break;
                case 'Aggregate Root':
                    command.push('aggregateroot');
                    break;
                case 'Command Handler':
                    command.push('commandhandler');
                    break;
                case 'Query':
                    const queryPick = await vscode.window.showQuickPick(['Query', 'Query For a Read Model'], {canPickMany: false, ignoreFocusOut: true});
                    if (queryPick === 'Query') command.push('query');
                    else command.push('queryfor');
                    break;
                case 'Event Processor':
                    command.push('eventprocessor');
                    break;
                case 'Concept':
                    const conceptPick = await vscode.window.showQuickPick(
                        ['Concept', 'Int Concept', 'String Concept', 'GUID Concept'],
                        {canPickMany: false, ignoreFocusOut: true}
                    );
                    if (conceptPick === 'Concept') command.push('concept');
                    else if (conceptPick === 'Int Concept') command.push('intconcept');
                    else if (conceptPick === 'String Concept') command.push('stringconcept');
                    else if (conceptPick === 'GUID Concept') command.push('guidconcept');
                    break;
            }

            const artifactName = await vscode.window.showInputBox({prompt: 'Artifact name: ', ignoreFocusOut: true});
            let commandArgs = [artifactName];
            runDolittleCliCommandThroughIntegratedTerminal(command, commandArgs, {cwd: path.dirname(editor.document.uri.fsPath)})
        } catch (error) {
            globals.dolittleProjectOutputChannel.appendLine(`Could not add artifact.\nError: ${error}`);
            vscode.window.showErrorMessage('Could add artifact ', error);
        }
    });
}

const _activate = activate;
export { _activate as activate };

// this method is called when your extension is deactivated
function deactivate() {
}
const _deactivate = deactivate;
export { _deactivate as deactivate };