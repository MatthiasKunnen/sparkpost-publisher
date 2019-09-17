import { Command } from 'commander';
import * as commander from 'commander';

import { handlePublishOrDraft, PublishOrDraftParams } from './index';

interface Option {
    short?: string;
    name: string;
    type: 'string' | 'boolean';
    describe: string;
}

const draftAndPublish: Array<Option> = [
    {
        name: 'api-key',
        type: 'string',
        describe: 'SparkPost API key',
    },
    {
        name: 'api-version',
        type: 'string',
        describe: 'Sparkpost API version, defaults to v1',
    },
    {
        name: 'endpoint',
        type: 'string',
        describe: 'Sparkpost endpoint, defaults to https://api.sparkpost.com:443',
    },
    {
        name: 'suffix',
        type: 'string',
        describe: 'Specify a suffix for your template IDs',
    },
    {
        name: 'template',
        type: 'string',
        describe: 'Execute the operation on a single template',
    },
    {
        short: 'v',
        name: 'verbose',
        type: 'boolean',
        describe: 'More debug output',
    },
];

function optionUsageTag({short, name}: Option): string {
    return short !== undefined ? `-${short}, --${name}` : `--${name}`;
}

function optionParam(option: Option): string {
    switch (option.type) {
        case 'string':
            return ` <${option.name}>`;
        case 'boolean':
            return '';
    }
}

function applyOptions(command: Command, options: Array<Option>): Command {
    options.forEach(o => command.option(optionUsageTag(o) + optionParam(o), o.describe));
    return command;
}

function checkApiKey(req: any): void {
    if (req.apiKey == null) {
        throw new Error('SparkPost API key not set.');
    }
}

async function parsePublishOrDraft(req: any, publish: boolean) {
    checkApiKey(req);

    const options: PublishOrDraftParams = {
        apiKey: req.apiKey,
        apiVersion: req.apiVersion,
        endpoint: req.endpoint,
        publish,
        suffix: req.suffix,
        verbose: req.verbose,
    };

    if (req.template) {
        options.template = req.template;
    }

    return handlePublishOrDraft(options);
}

function withErrors(fn: (...args) => Promise<void>) {
    return async (...args: any[]) => {
        try {
            await fn(...args);
        } catch (e) {
            console.error(e);
            process.exitCode = 1;
        }
    };
}

applyOptions(commander.command('publish'), draftAndPublish)
    .action(withErrors(req => parsePublishOrDraft(req, true)));

applyOptions(commander.command('draft'), draftAndPublish)
    .action(withErrors(req => parsePublishOrDraft(req, false)));

commander.parse(process.argv);
