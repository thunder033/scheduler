import '@scheduler/ui/test-utils';
import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

setupTestBed({
  zoneless: false,
  providers: [
    // Material's own animations (such as a dialog closing) run on timers, which tests shouldn't wait for
    { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
  ],
});
