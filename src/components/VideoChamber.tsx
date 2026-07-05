/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Activity, Users, Settings, Radio } from 'lucide-react';

interface VideoChamberProps {
  meetingTitle?: string;
  onClose?: () => void;
}

export default function VideoChamber({ meetingTitle = 'Investor Pitch Room', onClose }: VideoChamberProps) {
  const [videoOn, setVideoOn] = React.useState(true);
  const [audioOn, setAudioOn] = React.useState(true);
  const [connectionState, setConnectionState] = React.useState<'Connecting' | 'Established' | 'Disconnected'>('Connecting');
  const [latency, setLatency] = React.useState(22);

  React.useEffect(() => {
    // Simulate Peer connection delay
    const timer = setTimeout(() => {
      setConnectionState('Established');
    }, 1800);

    // Simulate real-time signal noise/latency fluctuation
    const interval = setInterval(() => {
      if (connectionState === 'Established') {
        setLatency(prev => Math.max(12, Math.min(64, prev + (Math.random() > 0.5 ? 4 : -4))));
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [connectionState]);

  const handleDisconnect = () => {
    setConnectionState('Disconnected');
    if (onClose) {
      setTimeout(onClose, 800);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Signaling status bar */}
      <div className="bg-slate-900 px-5 py-3 border-b border-slate-850 flex items-center justify-between flex-wrap gap-2 text-white">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connectionState === 'Established' ? 'bg-emerald-400' : connectionState === 'Disconnected' ? 'bg-rose-400' : 'bg-indigo-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              connectionState === 'Established' ? 'bg-emerald-500' : connectionState === 'Disconnected' ? 'bg-rose-500' : 'bg-indigo-500'
            }`}></span>
          </span>
          <span className="font-sans font-semibold text-xs tracking-wide uppercase">
            {connectionState === 'Established' ? 'WebRTC SECURE' : connectionState === 'Disconnected' ? 'DISCONNECTED' : 'PEER HANDSHAKE'}
          </span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400 font-sans truncate max-w-xs">{meetingTitle}</span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-[10px]">
          <div className="flex items-center text-slate-400">
            <Activity className="h-3.5 w-3.5 mr-1 text-indigo-400" />
            <span>{latency}ms Ping</span>
          </div>
          <div className="flex items-center text-slate-400">
            <Users className="h-3.5 w-3.5 mr-1 text-indigo-400" />
            <span>2 / 2 Connected</span>
          </div>
        </div>
      </div>

      {/* Grid of video streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 p-4 gap-4 bg-slate-950 min-h-[300px]">
        {/* Local Stream */}
        <div className="relative aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
          {videoOn ? (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-indigo-950 flex items-center justify-center">
              <div className="relative text-center">
                <div className="w-16 h-16 bg-indigo-600/30 rounded-full flex items-center justify-center mx-auto mb-2 border border-indigo-500/50 animate-pulse">
                  <Radio className="h-6 w-6 text-indigo-400" />
                </div>
                <span className="text-xs font-mono tracking-wider font-semibold uppercase text-indigo-300">
                  Transmitting Camera Feed...
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <VideoOff className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <span className="text-xs text-slate-500 font-mono">Camera Blocked</span>
            </div>
          )}

          {/* Indicators */}
          <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-md text-xs font-mono font-semibold text-white flex items-center space-x-1.5 border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>You (Local Peer)</span>
            {!audioOn && <MicOff className="h-3.5 w-3.5 text-rose-500 ml-1.5" />}
          </div>
        </div>

        {/* Remote Partner Stream */}
        <div className="relative aspect-video bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
          {connectionState === 'Connecting' ? (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-xs text-slate-400 font-mono">Synchronizing WebRTC Jitter Buffer...</p>
            </div>
          ) : connectionState === 'Disconnected' ? (
            <div className="text-center p-4">
              <PhoneOff className="h-8 w-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">Channel Terminated</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
              <div className="relative text-center">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-xs font-mono tracking-wider font-semibold uppercase text-emerald-300">
                  Receiving Remote Peer Stream
                </span>
              </div>
            </div>
          )}

          {/* Indicators */}
          <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-md text-xs font-mono font-semibold text-white flex items-center space-x-1.5 border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Remote Partner</span>
          </div>
        </div>
      </div>

      {/* Control console bar */}
      <div className="bg-slate-900 px-5 py-4 border-t border-slate-850 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              videoOn
                ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
                : 'bg-rose-950 text-rose-400 border-rose-900 hover:bg-rose-900'
            }`}
            title={videoOn ? 'Stop Camera' : 'Start Camera'}
          >
            {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setAudioOn(!audioOn)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              audioOn
                ? 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
                : 'bg-rose-950 text-rose-400 border-rose-900 hover:bg-rose-900'
            }`}
            title={audioOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {audioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
        </div>

        <button
          onClick={handleDisconnect}
          className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-rose-950/25"
        >
          <PhoneOff className="h-4 w-4" />
          <span>Disconnect Call</span>
        </button>

        <button
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
          title="Meeting Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
