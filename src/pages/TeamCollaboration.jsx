import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext"
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { app } from "../firebase"
import { Users, UserPlus, Search, X, Check, Mail, AlertCircle } from 'lucide-react';

const TeamCollaboration = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'invites'
  const [invites, setInvites] = useState([]);
  
  const db = getFirestore(app);
  
  // Fetch team data
  useEffect(() => {
    if (!currentUser || !isOpen) return;
    
    const fetchTeamData = async () => {
      setIsLoading(true);
      
      try {
        // Check if user has a team
        const userTeamDoc = await getDoc(doc(db, 'userTeams', currentUser.uid));
        
        if (userTeamDoc.exists() && userTeamDoc.data().teamId) {
          const teamId = userTeamDoc.data().teamId;
          
          // Get team details
          const teamDoc = await getDoc(doc(db, 'teams', teamId));
          
          if (teamDoc.exists()) {
            setTeam({
              id: teamDoc.id,
              ...teamDoc.data()
            });
            
            // Set up listener for team members
            const q = query(
              collection(db, 'userTeams'),
              where('teamId', '==', teamId)
            );
            
            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
              const members = [];
              
              for (const doc of querySnapshot.docs) {
                const userData = doc.data();
                
                // Get user details
                try {
                  const userDoc = await getDoc(collection(db, 'users', doc.id));
                  if (userDoc.exists()) {
                    members.push({
                      id: doc.id,
                      email: userData.email,
                      name: userDoc.data().displayName || userData.email,
                      role: userData.role || 'member',
                      ...userData
                    });
                  } else {
                    members.push({
                      id: doc.id,
                      email: userData.email,
                      name: userData.email,
                      role: userData.role || 'member',
                      ...userData
                    });
                  }
                } catch (error) {
                  console.error("Error fetching user details:", error);
                  members.push({
                    id: doc.id,
                    email: userData.email,
                    name: userData.email,
                    role: userData.role || 'member',
                    ...userData
                  });
                }
              }
              
              setTeamMembers(members);
              setIsLoading(false);
            });
            
            // Also fetch team invites
            const invitesQuery = query(
              collection(db, 'teamInvites'),
              where('teamId', '==', teamId)
            );
            
            const invitesUnsubscribe = onSnapshot(invitesQuery, (querySnapshot) => {
              const invitesList = [];
              querySnapshot.forEach((doc) => {
                invitesList.push({
                  id: doc.id,
                  ...doc.data()
                });
              });
              
              setInvites(invitesList);
            });
            
            return () => {
              unsubscribe();
              invitesUnsubscribe();
            };
          } else {
            // Team doesn't exist anymore
            setTeam(null);
            setIsLoading(false);
          }
        } else {
          // User doesn't have a team
          setTeam(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
        setIsLoading(false);
      }
    };
    
    fetchTeamData();
  }, [currentUser, db, isOpen]);
  
  // Create a new team
  const createTeam = async (teamName) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create team document
      const teamRef = doc(collection(db, 'teams'));
      
      await setDoc(teamRef, {
        name: teamName,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        ownerId: currentUser.uid
      });
      
      // Associate user with team
      await setDoc(doc(db, 'userTeams', currentUser.uid), {
        teamId: teamRef.id,
        email: currentUser.email,
        role: 'owner',
        joinedAt: new Date()
      });
      
      // Fetch the newly created team
      const teamDoc = await getDoc(teamRef);
      
      setTeam({
        id: teamDoc.id,
        ...teamDoc.data()
      });
      
      setTeamMembers([{
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        role: 'owner'
      }]);
      
      setSuccess('Team created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error creating team:", error);
      setError('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send invite to join team
  const sendInvite = async (e) => {
    e.preventDefault();
    
    if (!team || !inviteEmail || !currentUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const inviteRef = doc(collection(db, 'teamInvites'));
      
      await setDoc(inviteRef, {
        teamId: team.id,
        teamName: team.name,
        invitedEmail: inviteEmail.trim().toLowerCase(),
        invitedBy: currentUser.uid,
        inviterEmail: currentUser.email,
        status: 'pending',
        createdAt: new Date()
      });
      
      setInviteEmail('');
      setSuccess('Invitation sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Switch to invites tab
      setActiveTab('invites');
    } catch (error) {
      console.error("Error sending invite:", error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel an invitation
  const cancelInvite = async (inviteId) => {
    if (!inviteId) return;
    
    try {
      await updateDoc(doc(db, 'teamInvites', inviteId), {
        status: 'cancelled'
      });
    } catch (error) {
      console.error("Error cancelling invite:", error);
      setError('Failed to cancel invitation.');
    }
  };
  
  // Leave team
  const leaveTeam = async () => {
    if (!currentUser || !team) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Remove user from team
      await updateDoc(doc(db, 'userTeams', currentUser.uid), {
        teamId: null,
        role: null
      });
      
      // If user is owner, transfer ownership to another member or delete team
      if (team.ownerId === currentUser.uid) {
        // Find another member to transfer ownership
        const otherMembers = teamMembers.filter(m => m.id !== currentUser.uid);
        
        if (otherMembers.length > 0) {
          // Transfer ownership to first available member
          const newOwner = otherMembers[0];
          
          await updateDoc(doc(db, 'teams', team.id), {
            ownerId: newOwner.id
          });
          
          await updateDoc(doc(db, 'userTeams', newOwner.id), {
            role: 'owner'
          });
        } else {
          // No other members, delete the team
          // Note: In a real app, you might want to keep the team data for historical purposes
          // Here we're just setting it as inactive
          await updateDoc(doc(db, 'teams', team.id), {
            active: false,
            deletedAt: new Date()
          });
        }
      }
      
      setTeam(null);
      setTeamMembers([]);
      setSuccess('You have left the team.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error leaving team:", error);
      setError('Failed to leave team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change member role
  const changeMemberRole = async (memberId, newRole) => {
    if (!memberId || !newRole || !team) return;
    
    try {
      await updateDoc(doc(db, 'userTeams', memberId), {
        role: newRole
      });
    } catch (error) {
      console.error("Error changing member role:", error);
      setError('Failed to update member role.');
    }
  };
  
  // Remove member from team
  const removeMember = async (memberId) => {
    if (!memberId || !team) return;
    
    try {
      await updateDoc(doc(db, 'userTeams', memberId), {
        teamId: null,
        role: null
      });
    } catch (error) {
      console.error("Error removing member:", error);
      setError('Failed to remove team member.');
    }
  };
  
  // Handle click outside modal
  const handleClickOutside = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      onClick={handleClickOutside}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-lg font-medium text-indigo-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Collaboration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center p-8">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : team ? (
          <>
            {/* Team exists - show team details */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
              <p className="text-sm text-gray-500">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
              </p>
              
              {/* Success and error messages */}
              {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-2 p-2 bg-green-100 text-green-800 rounded-md text-sm">
                  {success}
                </div>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'members' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('members')}
              >
                Members
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'invites' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('invites')}
              >
                Invitations
                {invites.filter(i => i.status === 'pending').length > 0 && (
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {invites.filter(i => i.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'members' ? (
                <div className="p-4">
                  {/* Team members list */}
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          <div className="text-xs text-indigo-600 mt-1">
                            {member.role === 'owner' ? 'Team Owner' : (member.role === 'admin' ? 'Admin' : 'Member')}
                          </div>
                        </div>
                        
                        {/* Member actions - only show for admin/owner and not for current user */}
                        {((team.ownerId === currentUser.uid || 
                           teamMembers.find(m => m.id === currentUser.uid)?.role === 'admin') && 
                           member.id !== currentUser.uid) && (
                          <div className="flex items-center space-x-2">
                            <select
                              value={member.role}
                              onChange={(e) => changeMemberRole(member.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1"
                              disabled={team.ownerId !== currentUser.uid && member.role === 'admin'}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              {team.ownerId === currentUser.uid && (
                                <option value="owner">Owner</option>
                              )}
                            </select>
                            
                            <button
                              onClick={() => removeMember(member.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Show indicator for current user */}
                        {member.id === currentUser.uid && (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Invite new member section */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invite Team Member</h4>
                    <form onSubmit={sendInvite} className="flex items-end">
                      <div className="flex-1 mr-2">
                        <label htmlFor="inviteEmail" className="block text-xs text-gray-500 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="inviteEmail"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isLoading}
                      >
                        <UserPlus className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                  
                  {/* Leave team button */}
                  <div className="mt-8 pt-4 border-t">
                    <button
                      onClick={leaveTeam}
                      className="text-sm text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      {team.ownerId === currentUser.uid ? 'Delete Team' : 'Leave Team'}
                    </button>
                  </div>
                </div>
              ) : (
                // Invites tab
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Pending Invitations</h4>
                  
                  {invites.filter(i => i.status === 'pending').length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>No pending invitations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invites
                        .filter(i => i.status === 'pending')
                        .map(invite => (
                          <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{invite.invitedEmail}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Invited {new Date(invite.createdAt.seconds * 1000).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => cancelInvite(invite.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  
                  {/* Past invites */}
                  {invites.filter(i => i.status !== 'pending').length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Past Invitations</h4>
                      <div className="space-y-3">
                        {invites
                          .filter(i => i.status !== 'pending')
                          .map(invite => (
                            <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{invite.invitedEmail}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {invite.status === 'accepted' ? (
                                    <span className="text-green-600">Accepted</span>
                                  ) : invite.status === 'rejected' ? (
                                    <span className="text-red-600">Declined</span>
                                  ) : (
                                    <span className="text-gray-600">Cancelled</span>
                                  )}
                                  {' '}{new Date(invite.createdAt.seconds * 1000).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // No team - show create team form
          <div className="p-6">
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a Team</h2>
              <p className="text-gray-600 mb-6">
                Teams help you collaborate with others on tasks and projects.
              </p>
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  createTeam(e.target.teamName.value);
                }}
                className="max-w-sm mx-auto"
              >
                <div className="mb-4">
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    placeholder="My Awesome Team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCollaboration;