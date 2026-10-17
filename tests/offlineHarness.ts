import * as pkg from '../src/utils/offlinePackage';
import { offlineUpdateState } from '../src/utils/offlineUpdates';
(window as any).offlineTest={...pkg,offlineUpdateState};
