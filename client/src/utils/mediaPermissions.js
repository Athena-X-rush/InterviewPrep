export const checkCameraAndMic = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      camera: false,
      microphone: false,
      message: 'This browser does not support camera and microphone checks.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop());

    return {
      granted: true,
      camera: true,
      microphone: true,
      message: 'Camera and microphone access granted.',
    };
  } catch (error) {
    return {
      granted: false,
      camera: false,
      microphone: false,
      message: error?.message || 'Permission was blocked. Please allow camera and microphone access.',
    };
  }
};
