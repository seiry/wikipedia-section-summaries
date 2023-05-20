# Mediawiki Summarizer

This repository contains a small tool that when added to your common.js file on Wikipedia or any other Wikimedia site, it will provide you with a summary of the articles.

## Installation

To install the Mediawiki Summarizer tool, follow the instructions below:

1. Access your user page on Wikipedia or any other Wikimedia site by clicking on your username at the top right of the webpage.
2. Navigate to your common.js page, which you can find as a subpage of your user page, such as [User:YourUsername/common.js](https://www.wikipedia.org/wiki/User:YourUsername/common.js)
3. Click "Edit" at the top right of the common.js page.
4. Copy and paste the following code snippet into the text editor on the common.js page:

```javascript
mw.loader.using(["oojs-ui-core", "oojs-ui.styles.icons-content"]).done(function () {
    mw.loader.getScript('https://unpkg.com/turndown@7.1.2/dist/turndown.js')
        .then(
            function () {
                mw.loader.getScript('https://en.summarium.net/mediawiki-summarizer/sectionFinder.js?' + Date.now())
                    .then(
                        function() {
                            mw.loader.getScript('https://en.summarium.net/mediawiki-summarizer/widget.js?' + Date.now());
                        },
                        function (e) {
                            mw.log.error(e.message); // => "Failed to load script"
                        }
                    );
            },
            function (e) {
                mw.log.error(e.message); // => "Failed to load script"
            }
        );
    mw.loader.load('https://en.summarium.net/mediawiki-summarizer/widget.css?' + Date.now(), 'text/css');
});
```

5. Click "Save page" to save your changes.
6. Refresh your Wikipedia/Wikimedia page, and the Mediawiki Summarizer tool should now be available on supported pages.

## Usage

The Mediawiki Summarizer will provide you with a summarized version of articles on Wikipedia or other Wikimedia sites. Look for an icon with a speech bubble located near the top-right corner of an article to access the summary.

## Support

If you encounter any issues or need help with the Mediawiki Summarizer tool, please submit an issue on the [GitHub repository](https://github.com/skripnik/wikipedia-section-summaries/).