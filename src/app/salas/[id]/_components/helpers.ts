export type Room = {
  id: string; name: string; type: string; emoji: string; max_members: number
}
export type RoomMessage = {
  id: string; room_id: string; sender_id: string; nickname: string
  content: string; is_system: boolean; created_at: string
}
export type RoomMember = {
  room_id: string; user_id: string; nickname: string; joined_at: string
}
export type ProfileRequest = {
  id: string; requester_id: string; target_id: string; status: string
  expires_at: string; room_id: string; requesterNickname?: string
}
export type ChatRequest = {
  id: string; requester_id: string; target_id: string; status: string
  expires_at: string; room_id: string; requesterNickname?: string
}
export type PublicProfile = {
  id: string; name: string; photo_best: string | null; city: string | null; plan: string
  bio: string | null
}
