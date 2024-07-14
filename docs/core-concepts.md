# Core Concepts

## Table of Contents

1. [Core Concepts](core-concepts.md)
2. [Components](components.md)
3. [Layouts](layouts.md)
6. [API Reference](api-reference.md)

Exlement is built on the following core concepts:

### Ready-Made Custom Elements

Exlement extends HTML through a library of pre-built custom elements. These elements behave like native HTML tags but encapsulate complex functionality, allowing developers to use advanced features without writing extensive JavaScript or CSS.

Exlement provides a rich set of pre-built elements:
- `<page-base>`: Root element for Exlement pages
- `<page-top>`: Header element
- `<page-container>`: General content container
- `<page-bottom>`: Footer element
- `<page-content>`: Dynamic content element
- `<page-nav-menu>`: Navigation menu element
- `<page-image-gallery>`: Image gallery element
- `<page-tabs>`: Tabbed interface element
- `<page-chat>`: AI-powered chat interface
- `<page-content-generator>`: AI-assisted content creation element
- `<page-proofreader>`: AI-powered text proofreading element
- `<page-ai-code-editor>`: AI-assisted code editor and Code analyzer

Example:
```html
<page-nav-menu items='[{"text": "Home", "url": "#"}]'></page-nav-menu>
```

## Declarative Syntax
Exlement promotes a declarative approach to web development. Complex layouts and functionalities are created using simple, HTML-like tags, reducing the need for custom JavaScript.
Example:
```html
<page-layout column="2">
  <page-column>Column 1 content</page-column>
  <page-column>Column 2 content</page-column>
</page-layout>
```


## AI Integration
Exlement seamlessly integrates AI capabilities into web applications through specialized elements. These elements handle the complexity of AI interactions, allowing developers to easily incorporate AI features. It comes support open ai and ollam out of the box
Example:
```html
<page-chat server-url="https://example.com/api/chat" model=""></page-chat>
```
**Key Features**

1. **Ready-Made Elements:** A comprehensive library of custom elements for various web development needs.
2. **Rapid Development:** Build feature-rich web applications quickly using pre-built components.
3. **AI-Ready Elements:** Integrate sophisticated AI features directly into HTML structure.
4. **Dynamic Content Generation:** Easily create and manage AI-generated content with dedicated elements.
5. **Advanced UI Components:** Implement complex UI elements with simple HTML-like tags.
6. **Seamless Interactivity:** Add interactive elements without writing JavaScript.
7. **Flexible Layouts:** Create responsive designs effortlessly using layout elements.

## Layouts and Responsiveness
Exlement provides powerful layout elements:

- `<page-layout>`: Create responsive grid layouts
- `<page-card-layout>`: Generate flexible card-based layouts
- `<page-column>`: Define individual columns within layouts

These elements automatically adapt to different screen sizes, ensuring responsiveness.


## Developer Experience
Exlement enhances the developer experience through:

1. Simplified Syntax: Complex functionalities expressed in simple HTML-like tags
2. Rapid Prototyping: Quickly build and test ideas using ready-made elements
3. AI-Assisted Development: Leverage AI features through dedicated elements
4. Minimal Learning Curve: Use familiar HTML-like syntax with powerful enhancements


## Performance and Optimization
Exlement is designed with performance in mind:

1. Optimized Elements: Each element is optimized for efficient rendering
2. Lazy Loading: Elements load resources as needed
3. Minimal Dependencies: Reduced overhead from external libraries
4. Efficient Updates: Optimized update cycles for smooth performance
