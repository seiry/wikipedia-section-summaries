# Wikipedia Section Summarizer

This repository contains a small tool that when added to your `global.js` file on Wikipedia or any other Medaiwiki site, will provide you an interface to generate summary of article sections.

![ezgif com-video-to-gif (1)](https://github.com/tonythomas01/wikipedia-section-summaries/assets/4214481/f578db18-b628-4490-b4e9-a7c226854a79)

Demo video: https://www.youtube.com/watch?v=mja1C6FnWes

## Installation

To install the Mediawiki Summarizer tool, follow the instructions below:

1. Access your user page on Wikipedia or any other Wikimedia site by clicking on your username at the top right of the webpage.
2. Navigate to your global.js page, which you can find as a subpage of your user page, such as [User:YourUsername/global.js](https://meta.wikimedia.org/wiki/User:YourUsername/global.js)
3. Click "Edit" at the top right of the global.js page.
4. Copy and paste the following code snippet into the text editor on the global.js page:

also, you can access this file via preference - `Custom JavaScript`

![](./preference.png)

```javascript
mw.loader
  .using(["oojs-ui-core", "oojs-ui.styles.icons-content"])
  .done(function () {
    var version = Date.now();
    $.when(
      mw.loader.getScript(
        "https://seiry.github.io/wikipedia-section-summaries/sectionFinder.js",
        "text/javascript"
      ),
      mw.loader.getScript(
        "https://seiry.github.io/wikipedia-section-summaries/widget.js",
        "text/javascript"
      ),
      mw.loader.load(
        "https://seiry.github.io/wikipedia-section-summaries/widget.css",
        "text/css"
      )
    ).then(
      function () {
        initializeSectionSummarizer();
      },
      function (e) {
        mw.log.error(e.message);
      }
    );
  });
```

5. Click "Save page" to save your changes.
6. Create an OpenAI Key using: [OpenAI API key](https://platform.openai.com/account/api-keys)
7. Refresh your Wikipedia/Wikimedia page, and the Mediawiki Summarizer tool should now be available on supported pages.

## Usage

The Mediawiki Summarizer will provide you with a summarized sections on Wikipedia or other Wikimedia sites. Look for an icon with a robot located in each long section in an article or a talk page.

## Support

If you encounter any issues or need help with the Mediawiki Summarizer tool, please submit an issue on the [GitHub repository](https://github.com/skripnik/wikipedia-section-summaries/).
