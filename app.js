var kaklo_settings = {
	api_base: 'http://deep-thoughts.dev/wp-json/wp/v2/',
	endpoints: {
		posts: { route: 'list-posts/', method: 'GET' },
		vote: { route: 'vote/', method: 'POST' }
	}
}

var $el;
var posts = {};
var votedOn = JSON.parse( localStorage.getItem( 'kaklo_votedOn' ) );

function getPostsFromServer( callback ) {
	doAjax( kaklo_settings.endpoints.posts, {} )
		.done( function( data ) {
			posts = data;
			if ( 'function' === typeof callback ) {
				callback.call();
			}
		} );
}
function getRandomPost() {
	var post = posts[ Math.floor( Math.random() * posts.length ) ];
	var current = $el.data( 'post' );
	if ( 'object' == typeof current && current.ID === post.ID ) {
		post = getRandomPost();
	}
	return post;
}
function showPost( post ) {
	$el.data( 'currentPost', post );
	$el.find( 'h1' ).text( post.title );
	$el.find( '.votes .up' ).text( post.upvotes );
	$el.find( '.votes .down' ).text( post.downvotes );
}

function getLS( key ) {
	var data = window.localStorage.getItem( key );
	try {
		return JSON.parse( data );
	} catch ( e ) {
		return data;
	}
}

function setLS( key, data ) {
	return window.localStorage.setItem( key, JSON.stringify( data ) );
}

function voteOnPost( post, updown ) {
	var readingList = getLS( 'readingList' ) || [];

	if ( 'up' === updown ) {
		if ( -1 === readingList.indexOf( post.ID ) ) {
			readingList.push ( post.ID );
			setLS( 'readingList', readingList );
			addReadingListElem( post );
		}
	}

	showPost( getRandomPost() );

	doAjax( kaklo_settings.endpoints.vote, {
		vote: updown,
		id: post.ID
	} );

}

function addReadingListElem( post ) {
	$el.find( '.reading-list ul' ).append( '<li data-id="' + post.ID + '"><a target=_blank href="' + post.permalink + '">' + post.title + '</a></li>' );
}

function doAjax( endpoint, data ) {
	return $.ajax( {
		url: kaklo_settings.api_base + endpoint.route,
		method: endpoint.method,
		data: data
	} );
}

$( function() {
	$el = $( '.kaklo' );

	getPostsFromServer( initAfterAjax );

	function initAfterAjax() {
		showPost( getRandomPost() );

		// display saved reading list
		$el.find( '.reading-list ul' ).empty();
		$.each( getLS( 'readingList' ), function( i, ID ) {
			$.each( posts, function( i, post ) {
				if ( post.ID === ID ) {
					addReadingListElem( post );
				}
			} );
		} );
	}

	$el.on( 'click', '.votes span', function( e ) {
		voteOnPost( $el.data( 'currentPost' ), $( this ).attr( 'class' ) );
	} );

	$el.on( 'click', '.clear-list', function( e ) {
		e.preventDefault();
		setLS( 'readingList', [] );
		$el.find( '.reading-list ul' ).empty();
	} );

} );
