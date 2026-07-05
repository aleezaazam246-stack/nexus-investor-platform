/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, Check, X, AlertTriangle, UserCheck, Inbox } from 'lucide-react';
import { Meeting, User } from '../types';

interface MeetingCalendarProps {
  meetings: Meeting[];
  currentUser: User;
  onAcceptMeeting?: (id: string) => Promise<void>;
  onRejectMeeting?: (id: string) => Promise<void>;
}

export default function MeetingCalendar({
  meetings,
  currentUser,
  onAcceptMeeting,
  onRejectMeeting
}: MeetingCalendarProps) {
  
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleAccept = async (id: string) => {
    if (!onAcceptMeeting) return;
    setLoadingId(id);
    try {
      await onAcceptMeeting(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!onRejectMeeting) return;
    setLoadingId(id);
    try {
      await onRejectMeeting(id);
    } finally {
      setLoadingId(null);
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
        <Inbox className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-slate-700 font-medium font-sans">No Meetings Scheduled</h4>
        <p className="text-slate-400 text-xs mt-1">
          Use the Pitch Scheduler to book a session with a collaborative partner.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-sans font-semibold text-slate-900 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Collaboration Planner Calendar
        </h3>
        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-150 px-2 py-0.5 rounded-full font-semibold">
          {meetings.length} Scheduled
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {meetings.map((meeting) => {
          const isHost = meeting.hostId === currentUser.id;
          const isPending = meeting.status === 'Pending';
          const isAccepted = meeting.status === 'Accepted';
          const isRejected = meeting.status === 'Rejected';

          return (
            <div
              key={meeting.id}
              className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors ${
                isPending ? 'bg-amber-50/20' : ''
              }`}
            >
              {/* Meeting Meta Details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-slate-900 font-sans font-semibold text-sm sm:text-base">
                    {meeting.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isAccepted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {meeting.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-mono">
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 mr-1" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 text-blue-600 mr-1" />
                    <span>{meeting.time} UTC</span>
                  </div>
                  <div className="flex items-center">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    <span>
                      {isHost ? 'With: ' : 'Hosted by: '}
                      <span className="text-blue-600 font-semibold font-sans">
                        {isHost ? meeting.guestName : meeting.hostName}
                      </span>
                    </span>
                  </div>
                </div>

                {isPending && isHost && (
                  <p className="text-[11px] text-amber-600 italic flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Conflict warning is bypassed if slot remains unbooked. Double-booking check runs on submission.
                  </p>
                )}
              </div>

              {/* Action Buttons for Host/Guest */}
              <div className="flex items-center space-x-2">
                {isPending && isHost ? (
                  <>
                    <button
                      onClick={() => handleAccept(meeting.id)}
                      disabled={loadingId !== null}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Accept Booking"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(meeting.id)}
                      disabled={loadingId !== null}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Decline Booking"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-mono italic">
                    {isAccepted ? 'Conference Link Live' : isRejected ? 'Cancelled' : 'Awaiting confirmation'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
