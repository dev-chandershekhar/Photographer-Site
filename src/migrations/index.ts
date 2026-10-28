import * as migration_20261025_061752_initial from './20261025_061752_initial';
import * as migration_20261025_070236_cms_schema from './20261025_070236_cms_schema';
import * as migration_20261025_070421_slug_optional from './20261025_070421_slug_optional';

export const migrations = [
  {
    up: migration_20261025_061752_initial.up,
    down: migration_20261025_061752_initial.down,
    name: '20261025_061752_initial',
  },
  {
    up: migration_20261025_070236_cms_schema.up,
    down: migration_20261025_070236_cms_schema.down,
    name: '20261025_070236_cms_schema',
  },
  {
    up: migration_20261025_070421_slug_optional.up,
    down: migration_20261025_070421_slug_optional.down,
    name: '20261025_070421_slug_optional'
  },
];
