import * as pkg from '../src/utils/offlinePackage';
import { offlineUpdateState } from '../src/utils/offlineUpdates';
import { getCachedSpriteObjectUrl, isArtworkAvailableOnDevice } from '../src/utils/offlinePackage';
(window as any).offlineTest={...pkg,offlineUpdateState,getCachedSpriteObjectUrl,isArtworkAvailableOnDevice};
