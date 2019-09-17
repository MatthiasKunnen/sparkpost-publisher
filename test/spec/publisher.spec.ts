import { expect } from 'chai';
import * as crypto from 'crypto';
import { TemplateContent } from 'sparkpost';
import * as SparkPost from 'sparkpost';

import { SparkPostPublisher } from '../../src/publisher';

const getApiKey: () => string = () => {
    const apiKey = process.env.SPARKPOST_API_KEY;

    if (apiKey === undefined) {
        throw new Error('Expects the SPARKPOST_API_KEY environment variable to be present');
    }

    return apiKey;
};

describe('Publisher', () => {
    const testTemplateId = `test-template-${crypto.randomBytes(20).toString('hex')}`;
    const testContent = {
        text: 'Content',
        from: 'test@email.sparkpost-publisher.sd4u.be',
        subject: 'Subject',
    };
    let publisher: SparkPostPublisher;
    let sparkPostClient: SparkPost;

    before(() => {
        sparkPostClient = new SparkPost(getApiKey());
    });

    beforeEach(async () => {
        publisher = new SparkPostPublisher({
            apiKey: getApiKey(),
        });
    });

    afterEach(async () => {
        try {
            await sparkPostClient.templates.delete(testTemplateId);
        } catch (e) {
            // Ignore
        }
    });

    describe('Create draft', () => {
        it('should create drafts', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, false);

            expect(await sparkPostClient.templates.get(testTemplateId, {
                draft: true,
            })).to.exist;
        });

        it('should not publish', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, false);

            expect(sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            })).to.eventually.be.rejected;
        });
    });

    describe('Update draft', () => {
        it('should update drafts', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, false);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, false);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: true,
            });

            const content: TemplateContent = <any>result.results.content;

            expect(content.text).to.equal('Updated');
        });

        it('should not publish', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, false);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, false);

            expect(sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            })).to.eventually.be.rejected;
        });

        it('should update drafts when a published version exists', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, true);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, false);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: true,
            });

            const content: TemplateContent = <any>result.results.content;

            expect(content.text).to.equal('Updated');
        });

        it('should update drafts but not publish when a published version exists', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, true);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, false);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            });

            const content: TemplateContent = <any>result.results.content;

            expect(content.text).not.to.equal('Updated');
        });
    });

    describe('Create published', () => {
        it('should create published templates without existing drafts', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, true);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            });

            expect(result).to.exist;
        });

        it('should create published templates with existing drafts', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, false);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, true);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            });

            const content: TemplateContent = <any>result.results.content;

            expect(content.text).to.equal('Updated');
        });
    });

    describe('Update published', () => {
        it('should update published templates', async () => {
            await publisher.createOrUpdate({
                id: testTemplateId,
                content: testContent,
            }, true);

            await publisher.createOrUpdate({
                id: testTemplateId,
                content: {
                    ...testContent,
                    text: 'Updated',
                },
            }, true);

            const result = await sparkPostClient.templates.get(testTemplateId, {
                draft: false,
            });

            const content: TemplateContent = <any>result.results.content;

            expect(content.text).to.equal('Updated');
        });
    });
});
