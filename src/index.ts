import chalk from 'chalk';
import * as fs from 'fs';
import { CreateOrUpdateTemplate, SparkPostPublisher, TemplateContent } from './publisher';

export interface SPFPublisherTypeConfig {
    file: string;
}

export interface SPFPublisherTemplateConfig {
    config: {
        [k: string]: SPFPublisherTypeConfig;
    };
    sparkpost: CreateOrUpdateTemplate;
}

export interface SPFPublisherConfig {
    [k: string]: SPFPublisherTemplateConfig | undefined;
}

export interface PublishOrDraftParams {
    apiKey: string;
    apiVersion?: string;
    endpoint?: string;
    publish: boolean;
    suffix?: string;
    template?: string;
    verbose: boolean;
}

let config: SPFPublisherConfig;

function getConfig() {
    if (config === undefined) {
        config = JSON.parse(fs.readFileSync('sparkpost-map.json', 'utf8'));
    }

    return config;
}

function getEmailContent(filename: string) {
    return fs.readFileSync(`dist/${filename}`, 'utf8');
}

function setContent(content: TemplateContent, templateConfig: SPFPublisherTemplateConfig) {
    Object.keys(templateConfig.config)
        .forEach(k => content[k] = getEmailContent(templateConfig.config[k].file));

    return content;
}

export function getTemplate(templateId: string): CreateOrUpdateTemplate {
    const templateConfig: SPFPublisherTemplateConfig | undefined = getConfig()[templateId];

    if (templateConfig === undefined) {
        throw new Error(`Could not find template with ID ${templateId}`);
    }

    if (templateConfig.config.text == null
        && templateConfig.config.html == null
        && templateConfig.config.email_rfc822 == null) {
        throw new Error(
            `At least one required (html/text/email_rfc822) in the config of ${templateId}`,
        );
    }

    const template: CreateOrUpdateTemplate = {
        ...templateConfig.sparkpost,
        id: templateId,
    };

    setContent(template.content, templateConfig);

    return template;
}

export async function handlePublishOrDraft(params: PublishOrDraftParams) {
    let templates;

    if (params.template) {
        templates = [getTemplate(params.template)];
    } else {
        templates = Object.keys(getConfig()).map(getTemplate);
    }

    const publisher = new SparkPostPublisher({
        apiKey: params.apiKey,
        apiVersion: params.apiVersion,
        endpoint: params.endpoint,
    });

    for (const t of templates) {
        let id = t.id;

        if (params.suffix !== undefined) {
            id += `-${params.suffix}`;
        }

        if (params.verbose) {
            console.log(`Updating ${id}`);
        }

        await publisher.createOrUpdate({
            ...t,
            id,
        }, params.publish);
        console.log(chalk.green(`Updated ${id}`));
    }
}
