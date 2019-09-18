[![npm version](https://img.shields.io/npm/v/sparkpost-publisher.svg?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/sparkpost-publisher)
[![Build Status](https://img.shields.io/travis/com/MatthiasKunnen/sparkpost-publisher/master.svg?logo=travis&style=for-the-badge)
](https://travis-ci.com/MatthiasKunnen/sparkpost-publisher)
[![Build Status](https://img.shields.io/npm/l/sparkpost-publisher?&style=for-the-badge)
](https://github.com/MatthiasKunnen/sparkpost-publisher/blob/master/LICENSE)

# SparkPost publisher
This library allows you to publish your emails to SparkPost automatically. No
longer you need to copy paste your emails to SparkPost and mistakenly update the
wrong template. A version controlled single source of truth for your emails.

Made for Foundation for Emails but can be used for other frameworks such as
MJML.

The library works by mapping your generated email files to a SparkPost template
using a JSON file called `sparkpost-map.json`. It is also possible to specify
the name and path of the file.

Basic example:
```json
{
    "password-reset": {
        "config": {
            "html": {
                "file": "password-reset.html"
            }
        },
        "sparkpost": {
            "content": {
                "from": {
                    "email": "no-reply@example.com",
                    "name": "Example.com"
                },
                "subject": "Password reset"
            },
            "options": {
                "transactional": true
            }
        }
    }
}
```

The keys of the root object are the IDs of the templates in SparkPost. If the ID
does not exist, the template will be created.

The `config` key contains the configuration used by this library.

**Config explained:**  
```json
{
    "html": {
        "file": "password-reset.html"
    },
    "email_rfc822": {
        "file": "password-reset.rfc"
    },
    "text": {
        "file": "password-reset.txt"
    }
}
```

This config object means the following:
- replace `content.html` with the contents of the file found at
`dist/password-reset.html`.
- replace `content.email_rfc822` with the contents of the file found at
`dist/password-reset.rfc`.
- replace `content.text` with the contents of the file found at
`dist/password-reset.txt`.

While you can use both _html_ and _text_ if desired, you cannot mix either of
them with _email_rfc822_.

The `config.content` object is essentially merged into the `sparkpost.content`
object after the source files are read.

The `sparkpost` key contains any template configuration you would like to
specify. This allows you to version control name, description and other options
of your templates. Add any configuration as described in
https://developers.sparkpost.com/api/templates.html#header-template-attributes.
Do NOT specify the `published` field or any readonly fields as this will cause
errors.  

# Usage

## Publish
Publish all your emails using the
`spp publish --api-key your-api-key-here`
command. Optionally, you can specify that you only wish to publish one email
using the `--template template-id` flag. New templates will be created and
published.

### Endpoint and API version
Endpoint and api version can be configured using `--endpoint` and `--api-version`.

### Multiple environments, review/staging
If you have multiple environments you can use the `suffix` flag to deploy your
templates with a suffix.

E.g. using `--suffix review` with template `password-reset` will create or
update a template with the ID of `password-reset-review`.

## Draft
Submit your drafts using the 
`spp draft` command with the same options as the
publish command.

## Verbose
Add the `-v` flag for more verbosity. Helpful to identify any errors.

# Permissions
The SparkPost API key needs the following permissions:

* Templates: Read/Write
