/**
 * Update Window UI - Modern Material Design Version
 * Handles all update UI interactions with smooth animations and professional styling
 */
(function () {
  'use strict';

  // DOM Elements
  const $ = (id) => document.getElementById(id);

  // Header
  const currentVersionEl = $('currentVersion');

  // Status
  const statusSection = $('statusSection');
  const statusMessage = $('statusMessage');
  const spinner = $('spinner');
  const statusIcon = $('statusIcon');
  const statusIconWrapper = $('statusIconWrapper');

  // Update Details
  const updateDetails = $('updateDetails');
  const newVersion = $('newVersion');
  const releaseDate = $('releaseDate');

  // Release Notes
  const releaseNotesSection = $('releaseNotesSection');
  const releaseNotesContent = $('releaseNotesContent');

  // Progress
  const progressSection = $('progressSection');
  const progressBar = $('progressBar');
  const progressText = $('progressText');
  const downloadSize = $('downloadSize');
  const downloadSpeed = $('downloadSpeed');
  const downloadEta = $('downloadEta');

  // Error
  const errorSection = $('errorSection');
  const errorText = $('errorText');

  // Buttons
  const btnCheck = $('btnCheck');
  const btnDownload = $('btnDownload');
  const btnInstall = $('btnInstall');
  const btnInstallIcon = $('btnInstallIcon');
  const btnInstallText = $('btnInstallText');
  const updateBadge = $('updateBadge');
  const btnSimulate = $('btnSimulate');
  const devTools = $('devTools');

  // Helper: Show/Hide with class toggle
  function toggleClass(el, className, add) {
    if (add === undefined) {
      el.classList.toggle(className);
    } else {
      el.classList[add ? 'add' : 'remove'](className);
    }
  }

  // Show spinner
  function showSpinner(show) {
    toggleClass(spinner, 'hidden', !show);
    toggleClass(statusIcon, 'hidden', show);
  }

  // Set status icon with Material icon
  function setStatusIcon(iconName, className) {
    statusIcon.textContent = '';
    statusIcon.className = `status-icon ${className}`;
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconName;
    statusIcon.appendChild(icon);
  }

  // Set status message
  function setStatus(message) {
    statusMessage.textContent = message;
  }

  // Show update details
  function showUpdateDetails(show, info) {
    toggleClass(updateDetails, 'hidden', !show);
    if (show && info) {
      newVersion.textContent = `v${info.version || '1.0.0'}`;
      if (info.releaseDate) {
        const date = new Date(info.releaseDate);
        releaseDate.textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
  }

  // Show release notes
  function showReleaseNotes(show, notes) {
    toggleClass(releaseNotesSection, 'hidden', !show);
    if (show && notes) {
      releaseNotesContent.innerHTML = formatReleaseNotes(notes);
    }
  }

  // Format release notes markdown
  function formatReleaseNotes(notes) {
    if (!notes) return '<p>No release notes available.</p>';

    let html = notes
      // Headers
      .replace(/^### (.*?)$/gm, '<h4>$1</h4>')
      .replace(/^## (.*?)$/gm, '<h4>$1</h4>')
      .replace(/^# (.*?)$/gm, '<h4>$1</h4>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Lists (unordered)
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Wrap lists
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

    // Wrap in paragraph
    if (!html.startsWith('<h') && !html.startsWith('<ul')) {
      html = '<p>' + html + '</p>';
    }

    return html;
  }

  // Show progress
  function showProgress(show) {
    toggleClass(progressSection, 'hidden', !show);
  }

  // Update progress bar and stats
  function setProgress(progressInfo) {
    const percent = progressInfo.percent;
    const pct = Math.max(0, Math.min(100, Math.round(percent || 0)));
    progressBar.style.width = pct + '%';
    progressText.textContent = pct + '%';

    // Format speed
    if (progressInfo.bytesPerSecond) {
      const speedMBps = progressInfo.bytesPerSecond / (1024 * 1024);
      downloadSpeed.textContent = `${speedMBps.toFixed(1)} MB/s`;
    } else {
      downloadSpeed.textContent = '-- MB/s';
    }

    // Format size
    if (progressInfo.total) {
      const totalMB = progressInfo.total / (1024 * 1024);
      const transferredMB = (progressInfo.transferred || 0) / (1024 * 1024);
      downloadSize.textContent = `${transferredMB.toFixed(1)} / ${totalMB.toFixed(1)} MB`;
    } else {
      downloadSize.textContent = '-- MB';
    }

    // Format ETA
    if (progressInfo.eta !== undefined && progressInfo.eta > 0) {
      const etaSec = Math.round(progressInfo.eta);
      if (etaSec < 60) {
        downloadEta.textContent = `${etaSec}s remaining`;
      } else {
        const etaMin = Math.floor(etaSec / 60);
        const etaSecLeft = etaSec % 60;
        downloadEta.textContent = `${etaMin}m ${etaSecLeft}s remaining`;
      }
    } else if (pct === 100) {
      downloadEta.textContent = 'Completed';
    } else {
      downloadEta.textContent = 'Calculating...';
    }
  }

  // Show error
  function showError(show, message) {
    toggleClass(errorSection, 'hidden', !show);
    if (show && message) {
      errorText.textContent = message;
    }
  }

  // Set button states
  function setButtonStates(states = {}) {
    btnCheck.disabled = !states.check;
    btnDownload.disabled = !states.download;
    btnInstall.disabled = !states.install;
  }

  // Main state handler
  function setState(state) {
    showError(false);

    switch (state?.status) {
      case 'checking':
        showSpinner(true);
        setStatus('Checking for updates...');
        showUpdateDetails(false);
        showReleaseNotes(false);
        showProgress(false);
        setButtonStates({ check: false });
        break;

      case 'available':
        showSpinner(false);
        if (state.info?.frontendOnly) {
          setStatusIcon('update', 'check');
          setStatus('Instant update available');
          if (updateBadge) {
            updateBadge.textContent = 'Instant Update';
            updateBadge.classList.add('hot-update');
          }
          if (btnInstallIcon) btnInstallIcon.textContent = 'refresh';
          if (btnInstallText) btnInstallText.textContent = 'Reload POS';
        } else {
          setStatusIcon('update', 'warning');
          setStatus('Update available');
          if (updateBadge) {
            updateBadge.textContent = 'Available';
            updateBadge.classList.remove('hot-update');
          }
          if (btnInstallIcon) btnInstallIcon.textContent = 'restart_alt';
          if (btnInstallText) btnInstallText.textContent = 'Install & Restart';
        }
        showUpdateDetails(true, state.info);
        showReleaseNotes(true, state.info?.releaseNotes);
        showProgress(false);
        setButtonStates({ check: true, download: true, install: false });
        break;

      case 'not-available':
        showSpinner(false);
        setStatusIcon('task_alt', 'check');
        setStatus('You are up to date');
        showUpdateDetails(false);
        showReleaseNotes(false);
        showProgress(false);
        setButtonStates({ check: true });
        break;

      case 'downloading':
        showSpinner(false);
        setStatusIcon('cloud_download', '');
        setStatus('Downloading update...');
        showProgress(true);
        setButtonStates({});
        break;

      case 'downloaded':
        showSpinner(false);
        setStatusIcon('task_alt', 'check');
        if (state.info?.frontendOnly) {
          setStatus('Update ready to apply');
          if (btnInstallIcon) btnInstallIcon.textContent = 'refresh';
          if (btnInstallText) btnInstallText.textContent = 'Reload POS';
        } else {
          setStatus('Update ready to install');
          if (btnInstallIcon) btnInstallIcon.textContent = 'restart_alt';
          if (btnInstallText) btnInstallText.textContent = 'Install & Restart';
        }
        showProgress(false);
        setButtonStates({ check: true, install: true });
        break;

      case 'error':
        showSpinner(false);
        setStatusIcon('error_outline', 'error');
        setStatus('Update check failed');
        showUpdateDetails(false);
        showReleaseNotes(false);
        showProgress(false);
        showError(true, state.info?.message || 'An unknown error occurred.');
        setButtonStates({ check: true });
        break;

      default:
        showSpinner(false);
        setStatusIcon('info', '');
        setStatus('Ready to check for updates');
        showUpdateDetails(false);
        showReleaseNotes(false);
        showProgress(false);
        setButtonStates({ check: true });
    }
  }

  // Event Handlers
  btnCheck.addEventListener('click', () => {
    window.electronAPI?.update?.check?.();
  });

  btnDownload.addEventListener('click', () => {
    window.electronAPI?.update?.download?.();
  });

  btnInstall.addEventListener('click', () => {
    if (confirm('This will restart your application to install the update. Continue?')) {
      window.electronAPI?.update?.install?.();
    }
  });

  btnSimulate.addEventListener('click', () => {
    window.electronAPI?.update?.check?.();
  });

  // IPC Listeners
  if (window.electronAPI?.update?.onStatus) {
    window.electronAPI.update.onStatus((payload) => {
      console.log('[Update UI] Status:', payload?.status);
      setState(payload);
    });
  }

  if (window.electronAPI?.update?.onProgress) {
    window.electronAPI.update.onProgress((progressInfo) => {
      if (progressInfo?.percent !== undefined) {
        // Ensure UI switches to downloading state so progress becomes visible
        try {
          setState({ status: 'downloading' });
        } catch (e) {
          // Fallback: explicitly show progress section
          showProgress(true);
        }
        setProgress(progressInfo);
      }
    });
  }

  // Initialize
  if (window.electronAPI?.getVersion) {
    window.electronAPI.getVersion()
      .then((version) => {
        currentVersionEl.textContent = version || 'Unknown';
      })
      .catch(() => {
        currentVersionEl.textContent = 'Unknown';
      });
  }

  if (window.electronAPI?.isDev) {
    window.electronAPI.isDev()
      .then((isDev) => {
        if (isDev) {
          toggleClass(devTools, 'hidden', false);
        }
      });
  }

  // Set initial state
  setState({ status: 'idle' });

  // Wrap setState in logging to debug visibility issues
  const _originalSetState = setState;
  setState = function(state) {
    console.log('[Update UI] setState called with status:', state?.status);
    console.log('[Update UI] BEFORE setState - visibility:', {
      statusSection: !statusSection.classList.contains('hidden'),
      updateDetails: !updateDetails.classList.contains('hidden'),
      releaseNotesSection: !releaseNotesSection.classList.contains('hidden'),
      progressSection: !progressSection.classList.contains('hidden'),
      errorSection: !errorSection.classList.contains('hidden')
    });
    _originalSetState(state);
    console.log('[Update UI] AFTER setState - visibility:', {
      statusSection: !statusSection.classList.contains('hidden'),
      updateDetails: !updateDetails.classList.contains('hidden'),
      releaseNotesSection: !releaseNotesSection.classList.contains('hidden'),
      progressSection: !progressSection.classList.contains('hidden'),
      errorSection: !errorSection.classList.contains('hidden')
    });
  };

  console.log('[Update UI] Initialized successfully');
})();
