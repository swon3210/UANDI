import { requireOptionalNativeModule } from 'expo';

import { FloatingBubbleModuleType } from './FloatingBubble.types';

// Android에만 네이티브 구현이 있다. iOS/web에서는 null이 되며, 호출 측에서 Platform으로 가드한다.
export default requireOptionalNativeModule<FloatingBubbleModuleType>('FloatingBubble');
