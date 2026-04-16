"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Users, FileText, ArrowLeft, Copy, CheckCircle2, UserMinus } from "lucide-react";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";

interface GroupDetails {
  group: {
    _id: string;
    name: string;
    description: string;
    members: string[];
    ownerId: string;
    inviteCode: string;
    createdAt: string;
  };
  assignments: any[];
}

export default function GroupDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [data, setData] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const session = await getSession();
        const token = (session as any)?.user?.accessToken;
        const uid = (session as any)?.user?.id || (session as any)?.user?.userId;
        setCurrentUserId(uid);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          router.push("/groups");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGroup();
  }, [id, router]);

  const copyInviteCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!data || currentUserId !== data.group.ownerId) return;
    
    if (confirm("Are you sure you want to remove this member from the group?")) {
      try {
        const session = await getSession();
        const token = (session as any)?.user?.accessToken;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups/${id}/members/${memberId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              group: {
                ...prev.group,
                members: prev.group.members.filter(m => m !== memberId)
              }
            };
          });
        } else {
          alert('Failed to remove member. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while removing the member.');
      }
    }
  };

  if (loading) {
    return (
      <AppLayout title="Group Loading">
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="h-32 bg-neutral-100 rounded-[24px] animate-pulse mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-neutral-100 rounded-[24px] animate-pulse" />
            <div className="h-64 bg-neutral-100 rounded-[24px] animate-pulse" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  const isOwner = currentUserId === data.group.ownerId;

  return (
    <AppLayout title={data.group.name} showBack onBack={() => router.push("/groups")}>
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
        <div className="bg-white rounded-[32px] p-6 md:p-10 border border-neutral-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-[#E97441] text-white flex items-center justify-center text-2xl font-black uppercase shrink-0 mt-1">
                {data.group.name.substring(0, 2)}
              </div>
              <div>
                <h1 className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
                  {data.group.name}
                </h1>
                {data.group.description && (
                  <p className="text-sm font-semibold text-muted-foreground/70 mb-4 max-w-xl">
                    {data.group.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-600">
                    <Users className="h-3 w-3" />
                    {data.group.members.length} {data.group.members.length === 1 ? 'Member' : 'Members'}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-600">
                    Created {format(new Date(data.group.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/60 min-w-[200px] text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Invite Code</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black tracking-widest text-[#1A1A1A] font-mono">{data.group.inviteCode}</span>
                </div>
                <Button 
                  onClick={copyInviteCode} 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3 rounded-full text-xs font-bold bg-white"
                >
                  {copied ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[20px] font-[800] tracking-tight mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Shared Assignments
            </h3>
            
            {data.assignments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[24px] border border-neutral-100 border-dashed">
                <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-muted-foreground font-semibold">No assignments shared yet.</p>
                {isOwner && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Share an assignment from the assignment results page.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {data.assignments.map(assignment => (
                  <Link href={`/assignments/${assignment._id}`} key={assignment._id}>
                    <div className="bg-white p-5 rounded-[20px] border border-neutral-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1A1A1A] truncate">{assignment.topic}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 truncate">
                            {assignment.difficulty}
                          </span>
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {format(new Date(assignment.createdAt), "MMM d")}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center">
                           <ArrowLeft className="h-4 w-4 rotate-180 text-neutral-600" />
                         </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-[20px] font-[800] tracking-tight mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Members ({data.group.members.length})
            </h3>
            <div className="bg-white rounded-[24px] border border-neutral-100 shadow-sm overflow-hidden p-2">
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                {data.group.members.map((memberId, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50">
                    <div className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">
                        {memberId === data.group.ownerId ? "Admin/Teacher" : "Student/Member"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{memberId}</p>
                    </div>
                    {memberId === data.group.ownerId ? (
                      <span className="text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        Owner
                      </span>
                    ) : isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => handleRemoveMember(memberId)}
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
