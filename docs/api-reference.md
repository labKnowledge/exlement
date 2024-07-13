# API Reference

## Table of Contents

1. [Core Concepts](core-concepts.md)
2. [Components](components.md)
3. [Layouts](layouts.md)
4. [AI Integration](ai-integration.md)
5. [Styling](styling.md)
6. [API Reference](api-reference.md)

Quick reference guide for Exlement components and their attributes:

1. `<page-base>`
   - No specific attributes
   ```
    <page-base>
     <!-- Other Exlement components go here -->
   </page-base>
   ```

2. `<page-top>`
   - `data`: JSON string containing logo and links
     - Example: data="{'logo': 'logo.png', 'links': ['Home', 'About', 'Contact']}"
   - `option`: JSON string for additional options
     - Example: option="{'logo': 'left'}"
     ```
        <page-top 
            data="{'logo': 'logo.png', 'links': ['Home', 'About', 'Contact']}"
            option="{'logo': 'left'}">
        </page-top>
     ```

3. `<page-container>`
   - No specific attributes
   ```
    <page-container>
        <!-- Main content goes here -->
    </page-container>
   ```

4. `<page-layout>`
   - `column`: Number of columns (default: "2")
   - `options`: JSON string for layout options
     - Example: options="{'size': 'same'}"
     ```
        <page-layout column="2" options="{'size': 'same'}">
            <!-- Content for layout goes here -->
        </page-layout>
     ```

5. `<page-content>`
   - `level`: Heading level from 1 to 8 (default: "1")
   - `text`: Content text
   ```
    <page-content level="1" text="Welcome to Exlement"></page-content>
   ```

6. `<page-nav-menu>`
   - `items`: JSON array of menu items
   - `theme`: Color theme (e.g., "light" or "dark")
   - `animation`: Animation type for submenus
   - `logo`: URL of the logo image
   - `logo-position`: Position of the logo (e.g., "left", "right", "center")
    ```
        <page-nav-menu 
            items='[{"text": "Home", "url": "#"}, {"text": "About", "url": "#about"}]'
            theme="light"
            animation="fade"
            logo="logo.png"
            logo-position="left">
        </page-nav-menu>
     ```

7. `<page-card-layout>`
   - `columns`: Number of columns (default: "3")
   - `min-card-width`: Minimum width of each card (default: "250px")
   ```
    <page-card-layout columns="3" min-card-width="300px">
        <!-- <page-card> components go here -->
    </page-card-layout>
   ```

8. `<page-card>`
   - No specific attributes (uses default card styling)
   ```
    <page-card>
        <!-- Card content goes here -->
    </page-card>
   ```

9. `<page-image-gallery>`
    - `layout`: Gallery layout type (e.g., "grid" or "slideshow")
    - `columns`: Number of columns for grid layout
    - `images`: JSON array of image objects
    - `slide-interval`: Interval for slideshow in milliseconds
    ```
        <page-image-gallery 
            layout="grid"
            columns="3"
            images='[{"src": "image1.jpg", "alt": "Image 1"}, {"src": "image2.jpg", "alt": "Image 2"}]'
            slide-interval="5000">  
        </page-image-gallery>
    ```

10. `<page-chat>`
    - `server-url`: URL of the chat server
    - `chat-type`: Type of chat (e.g., "default" or "ollama")
    - `model`: AI model to use (for specific AI integrations)
    - `response-key`: Key to extract response from server (if needed)
    ```
        <page-chat 
            server-url="https://aiapi.com/api/chat"
            chat-type="ollama"
            model="llama3">
        </page-chat>
    ```

12. `<page-content-generator>`
    - `server-url`: URL of the content generation server
    - `ai-type`: Type of AI to use (e.g., "openai" or "ollama")
    - `model`: AI model to use
    - `custom-prompt`: Custom prompt for content generation
    ```
        <page-content-generator
            server-url="https://aiapi.com/api/generate"
            ai-type="ollama"
            model="llama3">
        </page-content-generator>
    ```

13. `<page-proofreader>`
    - `ai-type`: Type of AI to use for proofreading
    - `model`: AI model to use
    - `server-url`: URL of the proofreading server
    - `response-key`: Key to extract response from server (if needed)
    ```
        <page-proofreader
            ai-type="openai"
            model="text-davinci-002"
            server-url="https://aiapi.com/api/proofread"
            response-key="corrected_text">
        </page-proofreader>
    ```

14. `<page-ai-code-editor>`
    - `ai-type`: Type of AI to use (e.g., "openai" or "ollama")
    - `model`: AI model to use
    - `server-url`: URL of the AI code assistance server
    - `language`: Programming language for the editor
    ```
        <page-ai-code-editor
            ai-type="openai"
            model="gpt-3.5-turbo"
            server-url="https://api.openai.com/v1/chat/completions"
            language="javascript">
        </page-ai-code-editor>
    ```

Usage Example:
```html
<page-layout column="2" options="{'size': 'side-bar-left'}">
  <page-content level="1" text="Welcome to Exlement"></page-content>
  <page-nav-menu items='[{"text": "Home", "url": "#"}]' theme="dark"></page-nav-menu>
</page-layout>