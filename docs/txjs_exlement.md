# PageTXAIChat Component Documentation

## Overview

The `PageTXAIChat` component is a custom web component that integrates Transformers.js to provide an AI-powered chat interface. It allows developers to easily incorporate advanced language models directly into their web applications, enabling real-time, client-side AI interactions.

## Features


- Seamless integration of Transformers.js
- Support for various open-source language models
- Real-time, streaming responses
- Customizable appearance
- Easy-to-use API


## Usage

To use the `PageTXAIChat` component in your HTML, simply include the following tag:

```html
<page-tx-chat></page-tx-chat>
```

## Attributes

The `PageTXAIChat` component supports the following attributes:

```html
<page-tx-chat
  model="string"      <!-- Specifies the Hugging Face model to use -->
  theme="string"      <!-- Sets the color theme ("light" or "dark") -->
  placeholder="string"<!-- Sets the placeholder text for the input field -->
  send-button-text="string" <!-- Sets the text for the send button -->
  task="string"       <!-- Specifies the task for the AI model -->
></page-tx-chat>
````
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| model | String | "Xenova/LaMini-Flan-T5-783M" | Specifies the Hugging Face model to use |
| theme | String | "light" | Sets the color theme ("light" or "dark") |
| placeholder | String | "Type a message" | Sets the placeholder text for the input field |
| send-button-text | String | "Send" | Sets the text for the send button |
| task | String | "text2text-generation" | Specifies the task for the AI model |


## Example

```html
<page-tx-chat
  model="Xenova/Phi-3-mini-4k-instruct"
  theme="dark"
  placeholder="Ask me anything..."
  send-button-text="Go"
  task="text-generation"
></page-tx-chat>
```

## Styling

The component uses Shadow DOM for encapsulation. You can customize the appearance by modifying the CSS variables:

```css
page-tx-chat {
  --chat-bg-color: #f0f0f0;
  --chat-text-color: #333;
  --chat-input-bg: #fff;
  --chat-input-color: #000;
  --chat-button-bg: #4CAF50;
  --chat-button-color: #fff;
}
```

## Events


The component does not emit custom events, but it responds to user interactions such as clicking the send button or pressing Enter in the input field.


## Methods


The component does not expose public methods. All functionality is handled internally.


## Browser Support

This component relies on modern web technologies including Custom Elements v1 and Shadow DOM v1. It is supported in all major modern browsers.


## Dependencies

- Transformers.js (loaded via CDN in the component)


## Performance Considerations

- The AI model is loaded and run client-side, which may require significant processing power and memory.
- Initial load time may be longer due to downloading the model.
- Consider using a smaller model for better performance on less powerful devices.


## Accessibility

The component is keyboard accessible. Users can navigate to the input field and send button using the Tab key, and can submit messages using the Enter key.


## Security

As the AI processing happens client-side, no data is sent to external servers, enhancing privacy and data security.


## Best Practices

1. Choose an appropriate model size based on your target devices and use case.
2. Provide clear instructions or examples to users on how to interact with the AI chat.
3. Implement error handling for cases where the model fails to load or generate a response.
4. Consider adding a loading indicator while the model is initializing.


## Limitations

- The component relies on the user's device capabilities to run the AI model.
- Very large language models may not be suitable for use with this component due to client-side resource constraints.
- The quality and capabilities of the chat are dependent on the chosen AI model.


## Future Enhancements
- Support for more Transformers.js tasks beyond text generation
- Option to switch models dynamically
- Built-in prompt templates for common use cases
- Integration with server-side APIs for enhanced functionality


## Troubleshooting

If you encounter issues:

1. Check the browser console for any error messages.
2. Ensure you're using a supported browser and it's up to date.
3. Verify that the specified model is available and compatible.
4. Check your internet connection, as the model needs to be downloaded.


## Contributing

Contributions to improve the PageTXAIChat component are welcome. Please submit issues and pull requests to the project repository.


## License

This component is released under the MIT License.
