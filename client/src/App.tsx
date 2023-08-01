import React, { ReactElement, useEffect, useRef, useState } from 'react';
import './App.css';
import Profile from './components/Profile';
import { Artist } from './types/artist';
import AlbumCard from './components/AlbumCard';
import Graph from './components/Graph';
import { Album } from './types/album';
import fetchAlbum from './data/fetchAlbum';
import AlbumSelect from './components/AlbumSelect';
import SearchArtist from './components/SearchArtist';
import SubmitArtist from './components/SubmitArtist';

const AlbumContext = React.createContext<any>({});

function App() {

  // This sets the initial state with useEffect.
  // Using typescript generic to ensure that return value is also a string
  const [_id, setId] = useState<string>("3l0CmX0FuQjFxr8SK7Vqag");
  const [name, setName] = useState<string>("");
  const [picUrl, setPicUrl] = useState<string>("");

  const [albums, setAlbums] = useState<Album[]>([]); // figure out how to make it run only once
  const [selectedAlbums, setSelectedAlbums] = useState<Album[]>([]);

  // set to true when data fetching is done for final re-render
  const [finished, setFinished] = useState<boolean>(false);
  const [selectedFinished, setSelectedFinished] = useState<boolean>(false);

  const [graphWidth, setGraphWidth] = useState(0);
  const [graphHeight, setGraphHeight] = useState(0);
  const graphRef = useRef(null);

  const [albumSelection, setAlbumSelection] = useState<string>("all-albums");

  // second argument is the dependencies to trigger useEffect when there is a rerender (like in the set functions)
  // we only need to run the side effect function once
  useEffect(() => {

    setGraphWidth(graphRef.current.offsetWidth);
    setGraphHeight(graphRef.current.offsetHeight);

    let albumArr : Album[] = [];

    if (!finished){
      fetch(`http://localhost:5000/artist/${_id}`)
      .then((response) => response.json(), (error) => console.log("Something went wrong: " + error))
      .then((artistJson: Artist) => {
        setId(artistJson._id);
        setName(artistJson.name);
        setPicUrl(artistJson.picUrl);

        (async function loop() {
          for (let id of artistJson.album_ids) {
            let album = await fetchAlbum(id);
            if (!finished){
              albumArr.push(album);
              setAlbums(albumArr);
            }
          }
          setFinished(true);
        })();
        
      })
      .catch((error) => {
        console.log("Something went wrong fetching artist id " + _id + "; " + error);
      });
    }

    if (finished && !selectedFinished){ // need to check that all albums are fetched first (finished boolean)
      for (let album of albums){
        if (albumSelection==="all-albums" || album._id === albumSelection){ // only one single album
          selectedAlbums.push(album);
          setSelectedAlbums(selectedAlbums);
          if (album._id === albumSelection){
            break;
          }
        }
      }
      setSelectedFinished(true);
    }
    
  }, [albumSelection, finished]);
  

  
  if (finished){ // when rendered
    const selectionElement = (document.getElementById("albums-selection") as HTMLInputElement);
    selectionElement.addEventListener("click", () => {
      setAlbumSelection(selectionElement.value);
      setSelectedAlbums([]);
      setSelectedFinished(false);
    });
  }

  const albumCards = (() => {
    if (selectedFinished){
      if (albumSelection==="all-albums"){
        return albums.map((album) => <AlbumCard album={album} />);
      }else{
        let album : Album = albums.filter((album)=>album._id===albumSelection)[0];
        return <AlbumCard album={album} />;
      }
    }
  })();

  return (
    <div id="submit-artist">
      <AlbumContext.Provider value={{albums, selectedAlbums, finished, selectedFinished, _id, setId, setFinished, setSelectedFinished, setSelectedAlbums}}>
        <div id="graph-side" ref={graphRef}>
            <div id="graph">
              < Graph width={graphWidth} height={graphHeight}/>
            </div>
          // selected song state
        </div>
        <div id="list-side">
          <SubmitArtist />
          <SearchArtist/>
          <Profile name={name} picUrl={picUrl} numAlbums={albums.length}/>
          <label htmlFor="albums-selection">Select an album: </label>
          <AlbumSelect />
          { albumCards }
        </div>
      </AlbumContext.Provider>
    </div>
  );
}

export { App, AlbumContext };
