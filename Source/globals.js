/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Dolittle. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {boilerPlatesManager, applicationsManager, boundedContextsManager, artifactsManager, dependenciesManager, logger} from '@dolittle/tooling.common';
import { loadProjectConfiguration, ProjectConfiguration } from './Configuration/ProjectConfiguration';
import { CommonToolingManager } from './CommonToolingManager';
import { PromptManager } from './PromptManager';

const dolittleOutputChannelName = 'Dolittle';
const dolittleProjectOutputChannelName = 'Dolittle Project';

class globals {
    #projectConfiguration;
    #dolittleOutputChannel;
    #dolittleProjectOutputChannel;
    #commonToolingManager;
    #promptManager;

    constructor() {
        this.#projectConfiguration = null;
        this.#dolittleOutputChannel = this.vscode.window.createOutputChannel(dolittleOutputChannelName);
        this.#dolittleProjectOutputChannel = this.vscode.window.createOutputChannel(dolittleProjectOutputChannelName);
        this.#promptManager = new PromptManager(dependenciesManager, logger);
        this.#commonToolingManager = new CommonToolingManager(boilerPlatesManager, applicationsManager, boundedContextsManager, artifactsManager, dependenciesManager, this.#promptManager, logger);
    }
    /**
     *
     *
     * @readonly
     * @memberof globals
     */
    get projectConfiguration() {
        return this.#projectConfiguration;
    }
    /**
     *
     *
     * @readonly
     * @memberof globals
     */
    get dolittleOutputChannel() {
        return this.#dolittleOutputChannel;
    }
    /**
     * 
     *
     * @readonly
     * @memberof globals
     */
    get dolittleProjectOutputChannel() {
        return this.#dolittleProjectOutputChannel;
    }
    get promptManager() {
        return this.#promptManager;
    }
    get commonToolingManager() {
        return this.#commonToolingManager;
    }
    /**
     *
     *
     * @memberof globals
     */
    async setProjectConfiguration() {
        let config = await loadProjectConfiguration();
        if (config === undefined) throw new Error('Project configuration was undefined');
        this.#projectConfiguration = config;
        
    }
}
export default new globals();