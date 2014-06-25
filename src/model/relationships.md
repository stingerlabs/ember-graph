# Relationships

The problem of maintaining relationship values from both the client and server is not an easy one. For me personally,
it's probably the most difficult problem I've faced in my programming career. To help demystify some of what is going
on, and to document my thought process for other people, I'm going to jot down notes here. They should hopefully
clear up any decisions I've made and show the reasoning behind them.

## Relationship States
From what I can tell, relationships can exist in three different states:

- **Saved** - This is a relationship that has been saved to the server and hasn't been modified in any way on the 
	client. It represents a current value and can't be deleted without the server's permission.
- **Deleted** - This is a saved relationship that has been queued for deletion on the client. The server doesn't know
	that it has been queued for deletion until the client saves this change. This is a client-side relationship in the
	sense that only a single client can know about it until it changes state. But it's also a server-side relationship
	in the sense that the server may freely apply the change without the client's permission.<sup>Note 1</sup>
- **Client** - This is a relationship that has just been created on a client. Again, the server doesn't know about it.
    This is a (kind of) hybrid relationship in the sense that both the server and client can change its state if need
    be. The server may upgrade this to a saved relationship if it wants to. <sup>Note 2</sup> The server may also delete
    the relationship if server-client conflicts are set to side with the server. On the other hand, the client may also
    specifically request that the change be applied. If the client wants to remove this relationship, the relationship
    is destroyed completely; it doesn't have to be moved to an intermediate state first.

Note 1:
Note 2: