import { EnvironmentProviders, Provider } from '@angular/core';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';

/** Global providers for every unit test: Material animations off keeps dialogs and overlays synchronous. */
const testProviders: (Provider | EnvironmentProviders)[] = [
  { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
];

export default testProviders;
