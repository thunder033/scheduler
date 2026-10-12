---
paths: ["apps/shop/src/**/*", "packages/shop/**/*"]
---

# Component Best Practices

## Component Structure
- Self-contained components; prefer reading data from shared services or state instead of inputs
  - Only use inputs where multiple usages of the component may need different configuration depending on their usage context

## Styling and CSS
- Do not use ARIA attributes for styling, create a semantic CSS for each state
- Avoid using absolute pixel values for sizing and position of elements, use REM by default
  - pixel values are OK for border thickness and some edge cases with specific reason
- For styling Angular Material components, use SASS override mixins

# Component Harnesses
- Component harnesses describe the behavior of the component semantically, independent of the implementation and platform
  - generally follow conventions from Angular Material component harnesses
  - implementation or platform specific details like "click", "button", "input" are avoided; examples:
    - `togglePanel` -> `togglePanel`
    - `strokeInput` -> `stroke` or `strokeField`
    - `toggleButton` -> `toggleControl`
  - Child harnesses are exposed as public locator fields; write `toolSelector = this.locatorFor(ToolSelectorHarness)`, with no `getToolSelector`.
    - Getters are only for specific information
    - Keep optional variants private and expose semantic questions like `hasShapeSelector()`
  - Panel components expose a consistent vocabulary: isOpen(), togglePanel(), plus has<Child>(). Panel presence is detected with locatorForOptional, not by reading ARIA state.
  - Lookup lists return values, not elements. Use a method like getPaletteColors() or getShapeLabels() that returns a plain array in display order.
  - interactions with child elements are handled by harness methods, sub elements themselves are often not exposed
    - Example:
      ```
      class StrokeWidthPicker extends ComponentHarness {
        private strokeWidth = this.locatorFor(NumberInputHarness); 
      
        setStrokeWidth(value: number) {
          this.strokeWidth().setValue(value);
        }
        getStrokeWidth() { 
           return this.strokeWidth().getValue();
        }
      }
       ```
