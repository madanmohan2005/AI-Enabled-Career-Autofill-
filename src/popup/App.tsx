import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  UserProfile,
  DEFAULT_PROFILE,
  getLocalProfile,
  saveLocalProfile,
  getAuthToken,
  setAuthToken
} from '../storage/profileStorage';
import { FieldMappingResult } from '../detector/intelligentClassifier';

type Tab = 'autofill' | 'profile' | 'resume' | 'account';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('autofill');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mappings, setMappings] = useState<FieldMappingResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [filling, setFilling] = useState(false);
  const [fillMessage, setFillMessage] = useState<string | null>(null);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeMsg, setResumeMsg] = useState<string | null>(null);

  // Auth & Sync state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setToken] = useState<string | null>(null);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Load local profile and token
    getLocalProfile().then(p => setProfile(p));
    getAuthToken().then(t => setToken(t));

    // Check service health
    fetch('http://localhost:8080/api/health')
      .then(res => res.ok ? setBackendStatus('online') : setBackendStatus('offline'))
      .catch(() => setBackendStatus('offline'));

    fetch('http://localhost:8000/health')
      .then(res => res.ok ? setAiStatus('online') : setAiStatus('offline'))
      .catch(() => setAiStatus('offline'));
  }, []);

  // 1. Scan Form Fields
  const handleScanFields = async () => {
    setScanning(true);
    setFillMessage(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' }, (response) => {
          setScanning(false);
          if (chrome.runtime.lastError || !response || response.status !== 'ok') {
            setFillMessage('No active form fields detected on this page.');
            setMappings([]);
          } else {
            setMappings(response.mappings || []);
            if (response.mappings.length === 0) {
              setFillMessage('No inputs found on the active tab.');
            }
          }
        });
      } else {
        setScanning(false);
      }
    } catch (err) {
      setScanning(false);
      setFillMessage('Could not connect to page content script.');
    }
  };

  // 2. Autofill Action
  const handleAutofill = async () => {
    setFilling(true);
    setFillMessage(null);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_AUTOFILL', mappings }, (response) => {
        setFilling(false);
        if (response?.status === 'ok') {
          setFillMessage(`Successfully filled ${response.filledCount} fields!`);
        } else {
          setFillMessage('Autofill completed.');
        }
      });
    } else {
      setFilling(false);
    }
  };

  // 3. Save Profile
  const handleSaveProfile = async () => {
    await saveLocalProfile(profile);
    setFillMessage('Profile saved locally!');
    setTimeout(() => setFillMessage(null), 3000);
  };

  // 4. Resume Parse
  const handleParseResume = async () => {
    if (!resumeFile) return;
    setParsingResume(true);
    setResumeMsg(null);

    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      const res = await fetch('http://localhost:8000/api/ai/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('AI Service failed to parse resume');
      const data = await res.json();

      const parsedFullName = data.full_name || profile.fullName || '';
      const nameParts = parsedFullName.trim().split(/\s+/);
      const parsedFirstName = nameParts[0] || profile.firstName || '';
      const parsedLastName = nameParts.slice(1).join(' ') || profile.lastName || '';

      // Merge into current profile
      const updatedProfile: UserProfile = {
        ...profile,
        fullName: parsedFullName,
        firstName: parsedFirstName,
        lastName: parsedLastName,
        email: data.email || profile.email,
        phone: data.phone || profile.phone,
        address: data.address || profile.address,
        jobTitle: data.job_title || profile.jobTitle,
        currentRole: data.current_role || profile.currentRole,
        desiredRole: data.desired_role || profile.desiredRole,
        linkedinUrl: data.linkedin_url || profile.linkedinUrl,
        githubUrl: data.github_url || profile.githubUrl,
        portfolioUrl: data.portfolio_url || profile.portfolioUrl,
        skills: data.skills?.length ? data.skills : profile.skills,
        summary: data.summary || profile.summary
      };

      if (data.education?.length) {
        updatedProfile.education = data.education.map((e: any) => ({
          college: e.college || '',
          university: e.university || '',
          degree: e.degree || '',
          fieldOfStudy: e.field_of_study || e.branch || '',
          branch: e.branch || e.field_of_study || '',
          cgpa: e.cgpa || '',
          graduationYear: e.graduation_year || ''
        }));
      }

      setProfile(updatedProfile);
      await saveLocalProfile(updatedProfile);
      setResumeMsg('Resume parsed and profile updated!');
    } catch (e: any) {
      setResumeMsg(`Failed: ${e.message}. Ensure AI service is running at port 8000.`);
    } finally {
      setParsingResume(false);
    }
  };

  // 5. Auth / Backend Sync
  const handleLogin = async () => {
    setAuthMsg('Authenticating...');
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setToken(data.token);
      await setAuthToken(data.token);
      setAuthMsg('Logged in successfully!');
    } catch (e: any) {
      setAuthMsg(`Error: ${e.message}`);
    }
  };

  const handleSyncWithBackend = async () => {
    if (!authToken) {
      setAuthMsg('Please log in first to sync with MySQL backend.');
      return;
    }
    setAuthMsg('Syncing profile to backend...');
    try {
      const res = await fetch('http://localhost:8080/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profile)
      });
      if (!res.ok) throw new Error('Sync failed');
      setAuthMsg('Profile synchronized with Spring Boot & MySQL!');
    } catch (e: any) {
      setAuthMsg(`Error: ${e.message}`);
    }
  };

  return (
    <div style={{
      width: '380px',
      minHeight: '520px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#0f172a',
      color: '#f8fafc',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>CareerFill</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span title={`Backend (8080): ${backendStatus}`} style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            background: backendStatus === 'online' ? '#065f46' : '#7f1d1d',
            color: backendStatus === 'online' ? '#34d399' : '#fca5a5'
          }}>API {backendStatus === 'online' ? '●' : '○'}</span>
          <span title={`AI Service (8000): ${aiStatus}`} style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            background: aiStatus === 'online' ? '#065f46' : '#7f1d1d',
            color: aiStatus === 'online' ? '#34d399' : '#fca5a5'
          }}>AI {aiStatus === 'online' ? '●' : '○'}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '3px', marginBottom: '16px' }}>
        {[
          { id: 'autofill', label: '⚡ Autofill' },
          { id: 'profile', label: '👤 Profile' },
          { id: 'resume', label: '📄 Resume' },
          { id: 'account', label: '🔐 Cloud' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === t.id ? '#3b82f6' : 'transparent',
              color: activeTab === t.id ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AUTOFILL */}
      {activeTab === 'autofill' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleScanFields}
              disabled={scanning}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {scanning ? 'Scanning DOM...' : '🔍 Scan Form Fields'}
            </button>
            <button
              onClick={handleAutofill}
              disabled={filling || mappings.length === 0}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: mappings.length > 0 ? '#10b981' : '#334155',
                color: '#ffffff',
                cursor: mappings.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {filling ? 'Filling...' : '🚀 Autofill Page'}
            </button>
          </div>

          {fillMessage && (
            <div style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: '#1e293b',
              color: '#38bdf8',
              fontSize: '12px',
              marginBottom: '10px'
            }}>
              {fillMessage}
            </div>
          )}

          {/* Mapped Fields List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #1e293b', borderRadius: '8px', padding: '6px' }}>
            {mappings.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Open a career application form and click <b>Scan Form Fields</b> to preview semantic matches.
              </div>
            ) : (
              mappings.map((m, idx) => {
                const badgeColor =
                  m.action === 'SAFE_AUTOFILL' ? '#10b981' :
                  m.action === 'REQUIRES_CONFIRMATION' ? '#f59e0b' : '#64748b';

                return (
                  <div key={idx} style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: '#1e293b',
                    marginBottom: '6px',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{m.fieldLabel}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${badgeColor}22`,
                        color: badgeColor,
                        fontWeight: 600
                      }}>
                        {m.detected_concept} ({(m.confidence_score * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Value: <span style={{ color: '#38bdf8' }}>{m.valueToFill || '—'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            
            {/* 1. Personal Information */}
            <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '8px', fontSize: '12px' }}>
                👤 Personal Information
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <label style={{ flex: 1 }}>
                  First Name:
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={e => {
                      const first = e.target.value;
                      const last = profile.lastName || '';
                      setProfile({
                        ...profile,
                        firstName: first,
                        fullName: `${first} ${last}`.trim()
                      });
                    }}
                    placeholder="First Name"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Last Name:
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={e => {
                      const last = e.target.value;
                      const first = profile.firstName || '';
                      setProfile({
                        ...profile,
                        lastName: last,
                        fullName: `${first} ${last}`.trim()
                      });
                    }}
                    placeholder="Last Name"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'block', marginBottom: '6px' }}>
                Full Legal Name:
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => {
                    const full = e.target.value;
                    const parts = full.trim().split(/\s+/);
                    setProfile({
                      ...profile,
                      fullName: full,
                      firstName: parts[0] || '',
                      lastName: parts.slice(1).join(' ') || ''
                    });
                  }}
                  placeholder="Full Legal Name"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <label style={{ flex: 1 }}>
                  Email:
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Phone:
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'block' }}>
                Residential / Mailing Address:
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Street Address, City, State, ZIP"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
            </div>

            {/* 2. Job Role / Position */}
            <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, color: '#fb923c', marginBottom: '8px', fontSize: '12px' }}>
                💼 Job Role / Position
              </div>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Job Title / Designation:
                <input
                  type="text"
                  value={profile.jobTitle || ''}
                  onChange={e => setProfile({ ...profile, jobTitle: e.target.value, currentRole: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Current Role / Position:
                <input
                  type="text"
                  value={profile.currentRole || ''}
                  onChange={e => setProfile({ ...profile, currentRole: e.target.value })}
                  placeholder="e.g. Full-Stack Developer at Acme Corp"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <label style={{ display: 'block' }}>
                Desired Role / Position Applied For:
                <input
                  type="text"
                  value={profile.desiredRole || ''}
                  onChange={e => setProfile({ ...profile, desiredRole: e.target.value })}
                  placeholder="e.g. Backend Engineer / ML Engineer"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <div style={{ marginTop: '6px', fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
                ⚡ These fields are embedded via AI — autofill will match any form asking for "designation", "position applied for", "current role", etc.
              </div>
            </div>

            {/* 3. Academic Background */}
            <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '8px', fontSize: '12px' }}>
                🎓 Academic Background & Field of Study
              </div>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                College / University:
                <input
                  type="text"
                  value={profile.education[0]?.college || profile.education[0]?.university || ''}
                  onChange={e => {
                    const edu = [...profile.education];
                    edu[0] = {
                      ...(edu[0] || {}),
                      college: e.target.value,
                      university: e.target.value,
                      degree: edu[0]?.degree || '',
                      fieldOfStudy: edu[0]?.fieldOfStudy || edu[0]?.branch || '',
                      branch: edu[0]?.branch || edu[0]?.fieldOfStudy || '',
                      cgpa: edu[0]?.cgpa || '',
                      graduationYear: edu[0]?.graduationYear || ''
                    };
                    setProfile({ ...profile, education: edu });
                  }}
                  placeholder="e.g. Stanford University"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <label style={{ flex: 1 }}>
                  Degree:
                  <input
                    type="text"
                    value={profile.education[0]?.degree || ''}
                    onChange={e => {
                      const edu = [...profile.education];
                      edu[0] = {
                        ...(edu[0] || {}),
                        degree: e.target.value,
                        college: edu[0]?.college || '',
                        fieldOfStudy: edu[0]?.fieldOfStudy || edu[0]?.branch || '',
                        branch: edu[0]?.branch || edu[0]?.fieldOfStudy || '',
                        cgpa: edu[0]?.cgpa || '',
                        graduationYear: edu[0]?.graduationYear || ''
                      };
                      setProfile({ ...profile, education: edu });
                    }}
                    placeholder="e.g. Bachelor of Science"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Field of Study / Major:
                  <input
                    type="text"
                    value={profile.education[0]?.fieldOfStudy || profile.education[0]?.branch || ''}
                    onChange={e => {
                      const edu = [...profile.education];
                      const val = e.target.value;
                      edu[0] = {
                        ...(edu[0] || {}),
                        fieldOfStudy: val,
                        branch: val,
                        college: edu[0]?.college || '',
                        degree: edu[0]?.degree || '',
                        cgpa: edu[0]?.cgpa || '',
                        graduationYear: edu[0]?.graduationYear || ''
                      };
                      setProfile({ ...profile, education: edu });
                    }}
                    placeholder="e.g. Computer Science"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ flex: 1 }}>
                  CGPA / GPA:
                  <input
                    type="text"
                    value={profile.education[0]?.cgpa || ''}
                    onChange={e => {
                      const edu = [...profile.education];
                      edu[0] = {
                        ...(edu[0] || {}),
                        cgpa: e.target.value,
                        college: edu[0]?.college || '',
                        degree: edu[0]?.degree || '',
                        fieldOfStudy: edu[0]?.fieldOfStudy || edu[0]?.branch || '',
                        branch: edu[0]?.branch || edu[0]?.fieldOfStudy || '',
                        graduationYear: edu[0]?.graduationYear || ''
                      };
                      setProfile({ ...profile, education: edu });
                    }}
                    placeholder="e.g. 3.85 / 4.0"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Graduation Year:
                  <input
                    type="text"
                    value={profile.education[0]?.graduationYear || ''}
                    onChange={e => {
                      const edu = [...profile.education];
                      edu[0] = {
                        ...(edu[0] || {}),
                        graduationYear: e.target.value,
                        college: edu[0]?.college || '',
                        degree: edu[0]?.degree || '',
                        fieldOfStudy: edu[0]?.fieldOfStudy || edu[0]?.branch || '',
                        branch: edu[0]?.branch || edu[0]?.fieldOfStudy || '',
                        cgpa: edu[0]?.cgpa || ''
                      };
                      setProfile({ ...profile, education: edu });
                    }}
                    placeholder="e.g. 2024"
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                  />
                </label>
              </div>
            </div>

            {/* 4. Links & Skills */}
            <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
              <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '8px', fontSize: '12px' }}>
                🌐 Links & Technical Skills
              </div>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                LinkedIn URL:
                <input
                  type="text"
                  value={profile.linkedinUrl}
                  onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                GitHub URL:
                <input
                  type="text"
                  value={profile.githubUrl}
                  onChange={e => setProfile({ ...profile, githubUrl: e.target.value })}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Portfolio URL:
                <input
                  type="text"
                  value={profile.portfolioUrl || ''}
                  onChange={e => setProfile({ ...profile, portfolioUrl: e.target.value })}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
              <label style={{ display: 'block' }}>
                Technical Skills (comma-separated):
                <input
                  type="text"
                  value={profile.skills?.join(', ') || ''}
                  onChange={e => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', marginTop: '3px' }}
                />
              </label>
            </div>

            <button
              onClick={handleSaveProfile}
              style={{
                marginTop: '6px',
                padding: '9px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              💾 Save Profile Locally
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: RESUME AI */}
      {activeTab === 'resume' && (
        <div style={{ fontSize: '13px' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 12px 0', fontSize: '12px' }}>
            Upload your resume PDF to extract skills, education, and links directly into your CareerFill profile via the Python AI service.
          </p>
          <div style={{
            border: '2px dashed #334155',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            background: '#1e293b',
            marginBottom: '12px'
          }}>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setResumeFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              id="resume-upload-input"
            />
            <label htmlFor="resume-upload-input" style={{ cursor: 'pointer', color: '#38bdf8', fontWeight: 600 }}>
              {resumeFile ? `Selected: ${resumeFile.name}` : '📁 Choose Resume PDF'}
            </label>
          </div>
          <button
            onClick={handleParseResume}
            disabled={!resumeFile || parsingResume}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: resumeFile ? '#6366f1' : '#334155',
              color: '#ffffff',
              fontWeight: 600,
              cursor: resumeFile ? 'pointer' : 'not-allowed'
            }}
          >
            {parsingResume ? 'Extracting with AI...' : '✨ Parse Resume & Update Profile'}
          </button>
          {resumeMsg && (
            <div style={{ marginTop: '12px', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#38bdf8', fontSize: '12px' }}>
              {resumeMsg}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACCOUNT / CLOUD */}
      {activeTab === 'account' && (
        <div style={{ fontSize: '12px' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 12px 0' }}>
            Synchronize profile across browsers and devices using your Spring Boot + MySQL backend.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', marginTop: '3px' }}
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', marginTop: '3px' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={handleLogin}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
              <button
                onClick={handleSyncWithBackend}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#38bdf8', fontWeight: 600, cursor: 'pointer' }}
              >
                ☁ Sync Profile
              </button>
            </div>
            {authMsg && (
              <div style={{ marginTop: '8px', padding: '8px', borderRadius: '6px', background: '#1e293b', color: '#e2e8f0' }}>
                {authMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
