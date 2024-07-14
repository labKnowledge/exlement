# Exlement

![Exlement Logo](assets/imgs/express_element-logo.jpeg)

Exlement.js is a revolutionary web development framework that extends HTML with powerful, AI-ready custom elements. Build sophisticated websites and applications with the simplicity of writing HTML tags.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#Quick Start)
- [Documentation](docs/README.md)
- [Examples](docs/api-reference.md)

## Features

- **HTML Reimagined**: Create complex layouts and functionality with custom elements as simple as native HTML tags.
- **Rapid Development**: Build feature-rich web applications in record time.
- **AI-Ready Components**: Integrate sophisticated AI features directly into your HTML structure.
- **Dynamic Content Generation**: Easily create and manage dynamic content.
- **Advanced UI Components**: Implement complex UI elements with ease.
- **Seamless Interactivity**: Add interactive elements without extensive JavaScript knowledge.
- **Developer Tools Integration**: Enhance your development workflow with built-in tools.
- **Flexible Layouts**: Create responsive designs effortlessly.

## Installation

You can include ExpressElement in your project via CDN:

```html
<link rel="stylesheet" href="https://unpkg.com/exlement@1.0.0/assets/css/exlement.css">
<script src="https://unpkg.com/exlement@1.0.0/exlement.js"></script>
```

## Quick Start
Copy and paste this into an HTML file and you're ready.

Basic Page
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exlement Quick Start</title>
    <link rel="stylesheet" href="https://unpkg.com/exlement@1.0.0/assets/css/exlement.css">
    <script src="https://unpkg.com/exlement@1.0.0/exlement.js"></script>
</head>

<body>
    <page-base>
        <page-top
            data="{'logo': '../assets/imgs/express_element-logo.jpeg', 'links': ['Home', 'About', 'Contact']}"></page-top>
        <page-container>

            <page-content level="1" text="Welcome to Exlement"></page-content>
            <page-layout column="2">
                <page-content level="7"
                    text="Build websites faster than ever with custom HTML elements! "></page-content>

                <page-content level="7"
                    text="If not grouped by page container they are treated individually"></page-content>
            </page-layout>
            <page-layout column="3">
                <page-column>Column 1 content</page-column>
                <page-column>Column 2 content</page-column>
                <page-column>Column 3 content</page-column>
            </page-layout>
        </page-container>

        <page-bottom data="{'copyright': '2024 Exlement', 'links': ['Privacy', 'Terms']}"></page-bottom>
    </page-base>
</body>

</html>
```

**Chat**
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exlement Demo</title>
    <link rel="stylesheet" href="https://unpkg.com/exlement@1.0.0/assets/css/exlement.css">
    <script src="https://unpkg.com/exlement@1.0.0/exlement.js"></script>
</head>

<body>
    <page-base>
        <page-top
            data="{'logo': '../assets/imgs/express_element-logo.jpeg', 'links': ['Home', 'About', 'Contact']}"></page-top>
        <page-container>
            <page-chat server-url="https://api.openai.com/v1/chat/completions" chat-type="openai"
                        model="gpt-3.5-turbo">
                    </page-chat>
        </page-container>

        <page-bottom data="{'copyright': '2024 Exlement', 'links': ['Privacy', 'Terms']}"></page-bottom>
    </page-base>
    <script>
    window.EXLEMENT_CONFIG = {
        OPENAI_API_KEY: 'your key goes here'
    };
</script>
</body>

</html>
```


**AI Code Reviewer and Editor**
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exlement Demo</title>
    <link rel="stylesheet" href="https://unpkg.com/exlement@1.0.0/assets/css/exlement.css">
    <script src="https://unpkg.com/exlement@1.0.0/exlement.js"></script>
</head>

<body>
    <page-base>
        <page-top
            data="{'logo': '../assets/imgs/express_element-logo.jpeg', 'links': ['Home', 'About', 'Contact']}"></page-top>
        <page-container>
            <page-ai-code-editor ai-type="openai" model="gpt-3.5-turbo"
                        server-url="https://api.openai.com/v1/chat/completions" language="javascript"
                        api-key="your-api-key-here"></page-ai-code-editor>
        </page-container>

        <page-bottom data="{'copyright': '2024 Exlement', 'links': ['Privacy', 'Terms']}"></page-bottom>
    </page-base>
    <script>
    window.EXLEMENT_CONFIG = {
        OPENAI_API_KEY: 'your key goes here'
    };
</script>
</body>

</html>
```

## Exampls
- [basic](/example/basic.html)
- [advance](/example/index.html)
- [chat](/example/chat.html)
- [code nalyzer and editor](/example/code_review.html)