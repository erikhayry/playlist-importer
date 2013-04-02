'use strict';
if(typeof PLI === 'undefined'){
    var PLI = {}
}

var sp = getSpotifyApi();
    //get views and models
    PLI.viewsObject = sp.require('$api/views');
    PLI.modelsObject = sp.require('$api/models');

    //counter for number of playlist created this session
    PLI.playlistCount = 0;

var PlaylistImporter = (function() {
    /*
        showpage:
            responsible for switching pages, keep track of current page and reset values. 
            Assumes every page in the html has an id of the typ js-page-PAGEID
            
            id: page id
    */
    var showPage = function(id){
            var newActivePage = document.querySelector('#js-page-' + id);
            if(newActivePage && newActivePage !== PLI.activePage){
                //Reset pages
                switch(id){
                    case 1:
                        PLI.el.dropArea.value = '';
                        PLI.el.messageView.innerHTML = '';
                    break
                    case 2:
                        //Reset
                    break
                }
                PLI.activePage.classList.toggle('active');
                newActivePage.classList.toggle('active');
                PLI.activePage = newActivePage;
            }
    },
    /*
        generatePlaylist:
            responsible for creating playlists and checking if uri is in right format

    */
    generatePlaylist = function(){
        //try get track with api, if succesfull add to playlist
        var addTrack = function(){
            try {
                var track = PLI.modelsObject.Track.fromURI('spotify:track:' + trackId);
                PLI.tempPlaylist.add(track);
                successCount++;
            }
            catch (e) {
               failCount++;
            }     
        },
        addToPlayList = function(){
            var countString = ''; 
            //Go through all rows
            for(var i = 0; i < PLI.playListArray.length; i++){
                (PLI.playListArray[i].indexOf(spotifyUrl) == 0) ? trackId = PLI.playListArray[i].replace(spotifyUrl,'') : trackId = '';
                //if the row conatined a valid spoitfy uri > add to playlisy
                if(trackId !== ''){
                    if(typeof PLI.tempPlaylist === 'undefined' || PLI.tempPlaylist === ''){
                        //No playlist created yet so create and add counter as identifier
                        if (PLI.playlistCount > 0) countString = ' (' + PLI.playlistCount + ')';
                        PLI.tempPlaylist = new PLI.modelsObject.Playlist('New Playlist' + countString);
                        PLI.playlistCount++; 
                    }
                    //add track to playlist
                    addTrack();
                }
                else{
                    failCount++;
                }    
            }
            if(successCount > 0){
                //at least one track was found so playlist created > show page two containing success/fail count and playlist
                PLI.el.resutView.innerHTML = 'Tried to add ' + totalCount + ' song to the playlist: added: ' + successCount + ', failed: ' + failCount;
                var list = new PLI.viewsObject.List(PLI.tempPlaylist);
                PLI.el.playlistView.innerHTML = '';
                PLI.el.playlistView.appendChild(list.node);    
                PLI.tempPlaylist = '';
                showPage(2);
            }
            else{
                //Wrong format or only local files found
                if(PLI.el.messageView) PLI.el.messageView.innerHTML = 'No songs found. Please try again';
            }
        };  

        //Check if pasted value is changed and not empty
        if(PLI.newPlayListArray != '' && PLI.newPlayListArray !== PLI.playListArray){
            //We got new data -> start checking each row for track uri:s
            PLI.playListArray = PLI.newPlayListArray;
            var playlistName = '',
                trackId = '',
                spotifyUrl = 'http://open.spotify.com/track/', //current format of spotify urls
                totalCount = PLI.playListArray.length,
                successCount = 0,
                failCount = 0;

            addToPlayList()                  
        }
    },
    //Add eventlisteners to html elements
    bindEvents = function(){
        if(PLI.el.importPlaylistBtn){
            PLI.el.importPlaylistBtn.addEventListener('click', function(){
                if(PLI.el.dropArea){
                    var playListCopyString = PLI.el.dropArea.value;
                    PLI.newPlayListArray = playListCopyString.split(/\r\n|\r|\n/g);
                    generatePlaylist();
                }
            }, false);
        }
        if(PLI.el.importNewPlaylistBtn){
            PLI.el.importNewPlaylistBtn.addEventListener('click', function(){
                showPage(1);
            }, false);
        }
    },
    //get all elements needed
    getElements = function(){
        PLI.el = {};
        //All pages
        PLI.el.pages = document.querySelectorAll('.page');

        //Page 1
        PLI.el.dropArea = document.querySelector('#js-drop-area');
        PLI.el.importPlaylistBtn = document.querySelector('#js-import-playlist');
        PLI.el.messageView = document.querySelector('#js-message-view');

        //Page 2
        PLI.el.nameInput = document.querySelector('#js-playlist-name');
        PLI.el.playlistView = document.querySelector('#js-playlist-view');
        PLI.el.resutView = document.querySelector('#js-result-view');
        PLI.el.importNewPlaylistBtn = document.querySelector('#js-import-new-playlist');

        //get active page
        for(var i = 0; i < PLI.el.pages.length; i++){
            if(PLI.el.pages[i].className.indexOf('active') > -1){
                PLI.activePage = PLI.el.pages[i];
                break;
            }
        }

        bindEvents();  
    },
    //build album mosaic for app bakcground
    buildUi = function(){
        var coverHolderEl = document.querySelector('#js-cover-holder'),
            library_tracks = PLI.modelsObject.library.tracks, //get tracks from library using the api
            coverURL = '',
            coverHTML = '',
            randomInt = 0;
        //get 30 random images
        for (var i=0; i<30; i++) {
            randomInt = Math.floor(Math.random() * library_tracks.length);
            coverURL = library_tracks[randomInt].data.album.cover;
            coverHTML += '<img src="' + coverURL + '" class="cover-image"/>';
        }

        if(coverHolderEl) coverHolderEl.innerHTML = coverHTML;
    },
    init = function(){
        buildUi()
        getElements();
    }

    return {
        init: init
    }
}());

window.addEventListener('load', PlaylistImporter.init, false);