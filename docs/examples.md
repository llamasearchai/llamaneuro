# Examples

This page provides examples of using LlamaNeuro for various tasks.

## Basic Usage

```javascript

import { Llamaneuro } from 'llamaneuro';

// Initialize client
const client = new Llamaneuro();

// Use the client
const result = await client.process('example input');
console.log(result);
```

## Advanced Usage

```javascript
import { Llamaneuro } from 'llamaneuro';

// Advanced configuration
const config = {
  timeout: 60000,
  maxRetries: 3,
  debug: true,
  cacheResults: true
};

// Initialize client with custom configuration
const client = new Llamaneuro(config);

// Process batch of inputs
async function processBatch(inputs) {
  return await Promise.all(inputs.map(input => client.process(input)));
}

// Use the client with batch processing
const inputs = ['input1', 'input2', 'input3', 'input4'];
processBatch(inputs)
  .then(results => {
    results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`, result);
    });
  })
  .catch(error => {
    console.error('Error processing batch:', error);
  });
```

For more examples, check out the [examples directory](https://github.com/llamasearchai/llamaneuro/tree/main/examples) in the GitHub repository.
