---
paths: ["apps/shop/src/**/*", "packages/shop/**/*", "apps/*-ui/**/*", "packages/*-ui/**/*"]
---

Start with the `angular-developer` skill or angular MCP to determine best practices and appropriate patterns.
This file augments those standard best practices.
- From angular MCP, use only the `get_best_practices` and `search_documentation` tools
- When navigating or searching the workspace, use nx-based tools or MCP since Angular tools (like list_projects) will not be aware of NX 

# Component Best Practices

## Forms
- Use signal forms, NEVER use FormControl/FormBuilder

## Component Structure
- Self-contained components; prefer reading data from shared state, like the store, instead of properties or child components
  - Only use inputs where multiple usages of the component may need different configuration depending on their usage context
- For material components, import the component directly (ex. MatIcon), unless there is a reason to use the module (ex. MatIconModule)

## Styling and SCSS/CSS
- Use Tailwind classes primarily for styling
- Do not use ARIA attributes for styling, create a semantic CSS class for each state
- Avoid using absolute pixel values for sizing and position of elements, use REM by default
  - pixel values are OK for border thickness and some edge cases with specific reason
- For styling Angular Material components, use SASS override mixins
- Create and maintain common utility classes, variables, and mixins in the shared `packages/scheduler-ui/styles/`

## Animations
- Animate with animate.enter and animate.leave, and use grid-template-rows: 0fr to 1fr to animate to auto height.
- Use handler functions when the animation must be conditional.
- Leave animations also run for descendants of a removed view.
- animationend bubbles, so always filter event.target before finishing an animation.
- **Animation values**: keep durations, easing and widths as named SCSS variables, and share them across the related animations.

# Component Harnesses
- Component harnesses describe the behavior of the component semantically, independent of the implementation and platform
  - Conventions: generally follow conventions from Angular Material component harnesses
  - **Harness selectors**: use the `qa-<semanatic-name>` convention to retrieve elements; NEVER use classes or other attributes
  - **Semantic Naming**: implementation or platform specific details like "click", "button", "input" are avoided; examples:
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
