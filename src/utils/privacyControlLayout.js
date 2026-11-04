// Layout measured against 控制中心布局.png at the prototype's 360px logical width.
export const PRIVACY_CONTROL_ITEMS = [
  ['wifi','widget','2x1'], ['data','widget','2x1'],
  ['mediaPlayer','widget','2x2'], ['mediaControls','widget','2x2'],
  ['joyConnect','widget','2x1'], ['joyHeart','widget','2x1'],
  ['bluetooth','toggle','2x1'], ['hotspot','toggle','1x1'], ['airplane','toggle','1x1'],
  ['location','toggle','1x1'], ['screenshot','toggle','1x1'], ['darkMode','toggle','2x1'],
  ['dnd','toggle','1x1'], ['sound','toggle','1x1'], ['rotationLock','toggle','1x1'], ['screenRecord','toggle','1x1'],
  ['batterySaver','toggle','1x1'], ['boost','toggle','1x1'], ['share','toggle','1x1'], ['cast','toggle','1x1']
].map(([id,type,size]) => { const [w,h]=size.split('x').map(Number); return {id,type,size,w,h} })
