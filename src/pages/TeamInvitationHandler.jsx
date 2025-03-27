import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext"
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { app } from "../firebase"
import { Mail, Check, X, AlertCircle } from 'lucide-react';

const TeamInvitationHandler = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const db = getFirestore(app);
  
  // Fetch invitations for the current user
  useEffect(() => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    // Set up listener for invitations
    const q = query(
      collection(db, 'teamInvites'),
      where('invitedEmail', '==', currentUser.email),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invitesList = [];
      querySnapshot.forEach((doc) => {
        invitesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setInvitations(invitesList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error in invitations listener:", error);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, db]);
  
  // Handle accepting an invitation
  const acceptInvitation = async (invitation) => {
    if (!currentUser || !invitation) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Check if user already has a team
      const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
      
      if (userTeamDoc.exists() && userTeamDoc.data().teamId) {
        setError('You are already a member of a team. Leave your current team first.');
        setIsLoading(false);
        return;
      }
      
      // Update invitation status
      await updateDoc(doc(db, 'teamInvites', invitation.id), {
        status: 'accepted',
        acceptedAt: new Date()
      });
      
      // Add user to team
      await setDoc(doc(db, 'userTeams', currentUser.uid), {
        teamId: invitation.teamId,
        email: currentUser.email,
        role: 'member',
        joinedAt: new Date()
      });
      
      setSuccess(`You've joined ${invitation.teamName}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError('Failed to join team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle declining an invitation
  const declineInvitation = async (invitationId) => {
    if (!invitationId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'teamInvites', invitationId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      
      setSuccess('Invitation declined.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error declining invitation:", error);
      setError('Failed to decline invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return null; // Don't show anything while loading
  }
  
  if (invitations.length === 0) {
    return null; // Don't show anything if there are no invitations
  }
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-40">
      <div className="px-4 py-3 bg-indigo-50 border-b flex justify-between items-center">
        <h3 className="text-sm font-medium text-indigo-900 flex items-center">
          <Mail className="h-4 w-4 mr-2" />
          Team Invitations
        </h3>
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-indigo-600 rounded-full">
          {invitations.length}
        </span>
      </div>
      
      <div className="p-4">
        {/* Error & success messages */}
        {error && (
          <div className="mb-3 p-2 text-sm bg-red-100 text-red-800 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-3 p-2 text-sm bg-green-100 text-green-800 rounded-md flex items-start">
            <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        {/* Invitations list */}
        <div className="space-y-3">
          {invitations.map(invitation => (
            <div key={invitation.id} className="bg-gray-50 rounded-md p-3">
              <div className="mb-2">
                <div className="font-medium">Invitation to join {invitation.teamName}</div>
                <div className="text-sm text-gray-500">From {invitation.inviterEmail}</div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => declineInvitation(invitation.id)}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                  disabled={isLoading}
                >
                  Decline
                </button>
                <button
                  onClick={() => acceptInvitation(invitation)}
                  className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamInvitationHandler;