Frontend/app/test/[assignmentId]/page.tsx


const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const detectionRef = useRef<NodeJS.Timeout>(null);
  const modelsLoadedRef = useRef(false);
  const violationCountRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);


  // 1. Fetch Assignment Data
  useEffect(() => {
@@ -66,20 +72,29 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
    fetchAssignment();
  }, [assignmentId, router]);

  // 2. Load face-api models from github raw content to avoid public folder setup
  // 2. Load face-api models — local first, GitHub fallback
  useEffect(() => {
    const loadModels = async () => {
      try {
        // use weights from justadudewhohacks repo
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        ]);
        // Try loading from local public/models folder first (most reliable)
        const LOCAL_MODEL_URL = '/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_URL);
        console.log('[Proctoring] Face-api models loaded from LOCAL /models');
        modelsLoadedRef.current = true;
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models", err);
        // Let them proceed even if face verification fails to load models, but ideally we block.
        setModelsLoaded(true); 
      } catch (localErr) {
        console.warn("[Proctoring] Local model load failed, trying GitHub fallback...", localErr);
        try {
          const GITHUB_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
          await faceapi.nets.tinyFaceDetector.loadFromUri(GITHUB_URL);
          console.log('[Proctoring] Face-api models loaded from GitHub');
          modelsLoadedRef.current = true;
          setModelsLoaded(true);
        } catch (err) {
          console.error("Failed to load face-api models from both sources", err);
          modelsLoadedRef.current = false;
          setModelsLoaded(true); 
        }
      }
    };
    loadModels();
@@ -93,9 +108,14 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
    toast.error(`Test terminated: ${reason}`);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    // Exit fullscreen if active
@@ -138,9 +158,14 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
    setSubmitting(true);
    toast.error(reason);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.log(e));
@@ -214,19 +239,40 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
  }, [hasStarted, timeLeft, forceSubmit]);

  // 5. Face Detection Polling
  const startFaceDetection = () => {
  const startFaceDetection = useCallback(() => {
    if (detectionRef.current) clearInterval(detectionRef.current);

    // If models haven't loaded yet, retry after a delay
    if (!modelsLoadedRef.current) {
      console.log('[Proctoring] Models not loaded yet, retrying in 2s...');
      setTimeout(() => startFaceDetection(), 2000);
      return;
    }

    console.log('[Proctoring] Starting face detection polling');

    detectionRef.current = setInterval(async () => {
      try {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
          );

          console.log(`[Proctoring] Faces detected: ${detections.length}`);

          if (detections.length > 1) {
            setWarningMessage("MULTIPLE FACES DETECTED! Ensure you are alone.");
            violationCountRef.current += 1;
            setViolationCount(violationCountRef.current);
            setWarningMessage(
              `⚠️ MULTIPLE FACES DETECTED (${detections.length})! Violation ${violationCountRef.current}/3 — Ensure you are alone.`
            );
            toast.error(`Multiple faces detected! Violation ${violationCountRef.current}/3`);

            // Auto-submit after 3 multi-face violations
            if (violationCountRef.current >= 3 && !isSubmittingRef.current) {
              forceSubmit('Multiple persons detected repeatedly. Test auto-submitted.');
            }
          } else if (detections.length === 0) {
            setWarningMessage("Face not visible! Remain in frame.");
          } else {
@@ -237,23 +283,45 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
        console.error("Face detection error:", err);
      }
    }, 2000);
  };
  }, [forceSubmit]);

  // Attach stream to video element when it mounts
  useEffect(() => {
    if (hasStarted && stream && videoRef.current) {
      console.log('[Proctoring] Attaching camera stream to video element');
      videoRef.current.srcObject = stream;
      // If metadata is already loaded, start detection immediately
      if (videoRef.current.readyState >= 1) {
        startFaceDetection();
      }
    }
  }, [hasStarted, stream, startFaceDetection]);

  // Start the test
  const startTest = async () => {
    try {
      // Request Fullscreen
      await document.documentElement.requestFullscreen();
      // 1. Request Camera FIRST to ensure we have permission
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });

      // Request Camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      // 2. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      setStream(s);
      streamRef.current = s;
      setHasStarted(true);
      hasStartedRef.current = true;
      
      toast.success("Proctoring started. Stay in frame.");
    } catch (err) {
      console.error("Permission error:", err);
      setCameraError("Camera permission and Fullscreen access are strictly required to start the test.");
      toast.error("Failed to start proctoring. Please allow permissions.");
    }
@@ -398,6 +466,7 @@ export default function TakeTestPage({ params }: { params: Promise<{ assignmentI
              playsInline 
              muted 
              onLoadedMetadata={startFaceDetection}
              onCanPlay={(e) => (e.target as HTMLVideoElement).play()}
              className="w-full h-full object-cover rounded-xl border border-zinc-800 transform scale-x-[-1]" 
            />
            <div className="absolute top-6 left-6 flex gap-1">



Frontend/public/models/tiny_face_detector_model-shard1


Frontend/public/models/tiny_face_detector_model-weights_manifest.json


[{"weights":[{"name":"conv0/filters","shape":[3,3,3,16],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.009007044399485869,"min":-1.2069439495311063}},{"name":"conv0/bias","shape":[16],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.005263455241334205,"min":-0.9211046672334858}},{"name":"conv1/depthwise_filter","shape":[3,3,16,1],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.004001977630690033,"min":-0.5042491814669441}},{"name":"conv1/pointwise_filter","shape":[1,1,16,32],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.013836609615999109,"min":-1.411334180831909}},{"name":"conv1/bias","shape":[32],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.0015159862590771096,"min":-0.30926119685173037}},{"name":"conv2/depthwise_filter","shape":[3,3,32,1],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.002666276225856706,"min":-0.317286870876948}},{"name":"conv2/pointwise_filter","shape":[1,1,32,64],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.015265831292844286,"min":-1.6792414422128714}},{"name":"conv2/bias","shape":[64],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.0020280554598453,"min":-0.37113414915168985}},{"name":"conv3/depthwise_filter","shape":[3,3,64,1],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.006100742489683862,"min":-0.8907084034938438}},{"name":"conv3/pointwise_filter","shape":[1,1,64,128],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.016276211832083907,"min":-2.0508026908425725}},{"name":"conv3/bias","shape":[128],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.003394414279975143,"min":-0.7637432129944072}},{"name":"conv4/depthwise_filter","shape":[3,3,128,1],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.006716050119961009,"min":-0.8059260143953211}},{"name":"conv4/pointwise_filter","shape":[1,1,128,256],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.021875603993733724,"min":-2.8875797271728514}},{"name":"conv4/bias","shape":[256],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.0041141652009066415,"min":-0.8187188749804216}},{"name":"conv5/depthwise_filter","shape":[3,3,256,1],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.008423839597141042,"min":-0.9013508368940915}},{"name":"conv5/pointwise_filter","shape":[1,1,256,512],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.030007277283014035,"min":-3.8709387695088107}},{"name":"conv5/bias","shape":[512],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.008402082966823203,"min":-1.4871686851277068}},{"name":"conv8/filters","shape":[1,1,512,25],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.028336129469030042,"min":-4.675461362389957}},{"name":"conv8/bias","shape":[25],"dtype":"float32","quantization":{"dtype":"uint8","scale":0.002268134028303857,"min":-0.41053225912299807}}],"paths":["tiny_face_detector_model-shard1"]}]