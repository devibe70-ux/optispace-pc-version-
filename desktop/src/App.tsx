import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

type FileInfo = { path: string; size: number; hash: string | null; };
type CleanResult = { files_deleted: number; bytes_freed: number; errors: number; };
type ImageMatch = { file_path: string; similarity_score: number; };
type FuzzyMatchGroup = { primary_image: string; similar_images: ImageMatch[]; };
type CompressionResult = { original_file: string; compressed_file: string; original_size: number; compressed_size: number; space_saved: number; };

type AppState = {
  cleanup_count: number;
  used_pro_trial: boolean;
  license_key: string | null;
};

function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [licenseInput, setLicenseInput] = useState('');
  
  // Ad Modal State
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // App Features State
  const [scanDir, setScanDir] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanResult | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [imageDir, setImageDir] = useState('');
  const [matchGroups, setMatchGroups] = useState<FuzzyMatchGroup[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const [videoOutputDir, setVideoOutputDir] = useState('');
  const [compResult, setCompResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const state: AppState = await invoke('get_state');
      setAppState(state);
    } catch (e) {
      console.error("Failed to load state", e);
    }
  };

  const handleApplyLicense = async () => {
    try {
      const newState: AppState = await invoke('apply_license', { key: licenseInput });
      setAppState(newState);
      setError(null);
    } catch (e: any) {
      setError(e.toString());
    }
  };

  const calculateRequiredAds = (cleanupCount: number) => {
    if (cleanupCount <= 5) return 3; // First 5 cleanups = 3 ads
    return 5; // Max 5 ads
  };

  const requireAds = (action: () => Promise<void>) => {
    if (!appState) return;
    if (appState.license_key) {
      // Pro users bypass ads
      action();
      return;
    }
    
    // Free users see progressive ads
    const required = calculateRequiredAds(appState.cleanup_count);
    setAdCount(required);
    setAdsWatched(0);
    setPendingAction(() => action);
    setShowAdModal(true);
    
    // Simulate Ad watching (in production, we'd hook into AdSense loaded callback)
    let watched = 0;
    const interval = setInterval(() => {
      watched += 1;
      setAdsWatched(watched);
      if (watched >= required) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const executePendingAction = async () => {
    setShowAdModal(false);
    if (pendingAction) {
      await invoke('increment_cleanup');
      await loadState(); // refresh cleanup count
      await pendingAction();
      setPendingAction(null);
    }
  };

  const cancelAdSequence = () => {
    setShowAdModal(false);
    setPendingAction(null);
    setError("Cleanup canceled. You must finish viewing the ads to proceed on the Free Tier.");
  };

  const handleScan = async () => {
    if (!scanDir) return;
    requireAds(async () => {
      setIsScanning(true);
      setError(null);
      try {
        const result: FileInfo[] = await invoke('scan_directory', { dir: scanDir });
        setFiles(result);
      } catch (e: any) {
        setError(e.toString());
      } finally {
        setIsScanning(false);
      }
    });
  };

  const handleCleanTemp = async () => {
    requireAds(async () => {
      setIsCleaning(true);
      setError(null);
      try {
        const result: CleanResult = await invoke('clean_temp_folders');
        setCleanResult(result);
      } catch (e: any) {
        setError(e.toString());
      } finally {
        setIsCleaning(false);
      }
    });
  };

  const requireProFeature = async (action: () => Promise<void>) => {
    if (!appState) return;
    if (appState.license_key) {
      action();
    } else if (!appState.used_pro_trial) {
      // Use 1-time trial
      await invoke('use_pro_trial');
      await loadState();
      action();
    } else {
      setError("Free Trial Exhausted! Please upgrade to Pro to unlock AI and Video features.");
    }
  };

  const handleImageMatch = async () => {
    if (!imageDir) return;
    requireProFeature(async () => {
      setIsMatching(true);
      setError(null);
      try {
        const result: FuzzyMatchGroup[] = await invoke('find_similar_images', { dir: imageDir, tolerance: 10 });
        setMatchGroups(result);
      } catch (e: any) {
        setError(e.toString());
      } finally {
        setIsMatching(false);
      }
    });
  };

  const handleVideoCompress = async () => {
    if (!videoInput || !videoOutputDir) return;
    requireProFeature(async () => {
      setIsCompressing(true);
      setError(null);
      try {
        const result: CompressionResult = await invoke('compress_video', { 
          inputPath: videoInput, 
          outputDir: videoOutputDir 
        });
        setCompResult(result);
      } catch (e: any) {
        setError(e.toString());
      } finally {
        setIsCompressing(false);
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container">
      <header className="header">
        <h1>OptiSpace <span className="highlight">AI</span></h1>
        <p>Intelligent On-Device Storage Optimizer</p>
        {appState && (
          <div className="account-status">
            <span className={`badge ${appState.license_key ? 'pro' : 'free'}`}>
              {appState.license_key ? 'PRO ACCOUNT' : 'FREE TIER (Ad-Supported)'}
            </span>
          </div>
        )}
      </header>

      {showAdModal && (
        <div className="ad-modal-overlay">
          <div className="ad-modal">
            <h2>Supporting Free Tier...</h2>
            <p>Please wait while we display {adCount} ads.</p>
            <div className="ad-container">
              {/* Fake Ad Banner for Mockup */}
              <div className="ad-banner">
                 <ins className="adsbygoogle"
                     style={{ display: "block", width: "100%", height: "90px" }}
                     data-ad-client="ca-pub-7107715238624071"
                     data-ad-slot="1234567890"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                 <span className="ad-label">Advertisement</span>
              </div>
            </div>
            <div className="ad-progress">
              Ads Viewed: {adsWatched} / {adCount}
            </div>
            <div className="ad-actions">
              <button className="btn danger" onClick={cancelAdSequence}>Skip & Cancel Cleanup</button>
              <button 
                className={`btn primary ${adsWatched < adCount ? 'disabled' : ''}`} 
                onClick={executePendingAction}
                disabled={adsWatched < adCount}
              >
                Proceed to Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        {error && <div className="alert error">{error}</div>}
        
        {appState && !appState.license_key && (
          <section className="card upgrade-card">
            <div className="card-header">
              <h2>👑 Upgrade to OptiSpace Pro</h2>
              <p>Remove all ads and unlock unlimited access to the AI Image Matcher and Pro Video Compressor.</p>
            </div>
            <div className="card-body">
              <div className="pricing-tiers">
                <div className="tier"><h3>3 Months</h3><p>$2.99</p></div>
                <div className="tier"><h3>1 Year</h3><p>$9.99</p></div>
                <div className="tier"><h3>Lifetime</h3><p>$19.99</p></div>
              </div>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Enter License Key (Any string >5 chars for test)" 
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  className="path-input"
                />
                <button className="btn primary" onClick={handleApplyLicense}>Activate Pro</button>
              </div>
            </div>
          </section>
        )}

        {/* System Temp Cleaner (Free with Ads) */}
        <section className="card">
          <div className="card-header">
            <h2>System Temp Cleaner</h2>
            <p>Safely remove unnecessary system temporary files. <span className="free-badge">Requires Ad View</span></p>
          </div>
          <div className="card-body">
            <button className={`btn primary ${isCleaning ? 'loading' : ''}`} onClick={handleCleanTemp} disabled={isCleaning}>
              {isCleaning ? 'Cleaning...' : 'Clean Temp Folders'}
            </button>
            {cleanResult && (
              <div className="result-box success animate-in mt-4">
                <p><strong>Success!</strong> Cleaned system temp.</p>
                <div className="stats-grid">
                  <div className="stat-item"><span className="label">Freed</span><span className="value">{formatBytes(cleanResult.bytes_freed)}</span></div>
                  <div className="stat-item"><span className="label">Files Deleted</span><span className="value">{cleanResult.files_deleted}</span></div>
                  <div className="stat-item"><span className="label">Errors</span><span className="value">{cleanResult.errors}</span></div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Deep Duplicate Scanner (Free with Ads) */}
        <section className="card">
          <div className="card-header">
            <h2>Deep Duplicate Scanner</h2>
            <p>Scan a directory for exact file duplicates. <span className="free-badge">Requires Ad View</span></p>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input type="text" placeholder="Enter absolute path" value={scanDir} onChange={(e) => setScanDir(e.target.value)} className="path-input" />
              <button className={`btn secondary ${isScanning ? 'loading' : ''}`} onClick={handleScan} disabled={isScanning || !scanDir}>
                Scan Directory
              </button>
            </div>
            {files.length > 0 && (
              <div className="result-box animate-in mt-4">
                <h3>Scan Results</h3>
                <p>Found <strong>{files.length}</strong> files.</p>
                <div className="file-list">
                  {files.slice(0, 50).map((file, i) => (
                    <div key={i} className="file-item">
                      <span className="file-path">{file.path}</span>
                      <span className="file-size">{formatBytes(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* AI Fuzzy Image Scanner (Pro / Trial) */}
        <section className="card highlight-card">
          <div className="card-header">
            <h2>AI Fuzzy Image Scanner</h2>
            <p>Find visually similar photos. 
              {appState && !appState.license_key && !appState.used_pro_trial && <span className="trial-badge">1-Time Free Trial Available</span>}
              {appState && !appState.license_key && appState.used_pro_trial && <span className="pro-badge">Pro Feature Locked</span>}
            </p>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input type="text" placeholder="Enter absolute path" value={imageDir} onChange={(e) => setImageDir(e.target.value)} className="path-input" />
              <button className={`btn primary ${isMatching ? 'loading' : ''}`} onClick={handleImageMatch} disabled={isMatching || !imageDir}>
                Find Similar Images
              </button>
            </div>
            {matchGroups.length > 0 && (
              <div className="result-box animate-in mt-4">
                <h3>Similarity Groups</h3>
                <p>Found <strong>{matchGroups.length}</strong> groups of similar photos.</p>
                <div className="group-list">
                  {matchGroups.map((group, i) => (
                    <div key={i} className="match-group">
                      <div className="primary-match"><strong>Primary:</strong> <span className="file-path">{group.primary_image}</span></div>
                      <div className="similar-matches">
                        {group.similar_images.map((sim, j) => (
                          <div key={j} className="similar-item"><span className="file-path">↳ {sim.file_path}</span><span className="badge similarity-badge">{sim.similarity_score.toFixed(1)}% Match</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Pro-Grade Video Compression (Pro / Trial) */}
        <section className="card highlight-card video-card">
          <div className="card-header">
            <h2>Pro-Grade Video Compression</h2>
            <p>Compress video with FFmpeg. 
              {appState && !appState.license_key && !appState.used_pro_trial && <span className="trial-badge">1-Time Free Trial Available</span>}
              {appState && !appState.license_key && appState.used_pro_trial && <span className="pro-badge">Pro Feature Locked</span>}
            </p>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input type="text" placeholder="Input Video Path" value={videoInput} onChange={(e) => setVideoInput(e.target.value)} className="path-input" />
              <input type="text" placeholder="Output Directory" value={videoOutputDir} onChange={(e) => setVideoOutputDir(e.target.value)} className="path-input" />
              <button className={`btn secondary ${isCompressing ? 'loading' : ''}`} onClick={handleVideoCompress} disabled={isCompressing || !videoInput || !videoOutputDir}>
                Optimize Video
              </button>
            </div>
            {compResult && (
              <div className="result-box success animate-in mt-4">
                <h3>Optimization Complete</h3>
                <div className="stats-grid">
                  <div className="stat-item"><span className="label">Original Size</span><span className="value">{formatBytes(compResult.original_size)}</span></div>
                  <div className="stat-item"><span className="label">New Size</span><span className="value">{formatBytes(compResult.compressed_size)}</span></div>
                  <div className="stat-item"><span className="label">Space Saved</span><span className="value">{formatBytes(compResult.space_saved)}</span></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <a href="javascript:googlefc.callbackQueue.push(googlefc.showRevocationMessage)">Do Not Sell or Share My Personal Information</a>
      </footer>
    </div>
  );
}

export default App;
