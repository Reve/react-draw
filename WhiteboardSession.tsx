import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import Whiteboard from "./Whiteboard";
import { IUser } from "../../cjt";
import { Container } from "react-bootstrap";
import { WS_URL } from "../../config/env";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function WhiteboardSession() {
  const [drawData, setDrawData] = useState<string>("");
  const [participants, setParticipants] = useState<IUser[]>([]);
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(socket.current?.connected);

  const fetchWhiteboard = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const whiteboardId = queryParams.get("id");

    socket.current?.emit("join", whiteboardId);
  };

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const _socket = io(WS_URL, {
      auth: {
        token,
      },
    });

    socket.current = _socket;

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.current.on("connect", onConnect);
    socket.current.on("disconnect", onDisconnect);
    socket.current.on("users_changed", onUsersChanged);
    socket.current.on("draw", onDraw);

    fetchWhiteboard();

    return () => {
      socket.current?.off("connect", onConnect);
      socket.current?.off("disconnect", onDisconnect);
      socket.current?.off("users_changed", onUsersChanged);
      socket.current?.off("draw", onDraw);
    };
  }, []);

  const onUsersChanged = (data: IUser[]) => {
    console.log("received user_joined event");
    setParticipants([...data]);
  };

  const onDraw = (data: string) => {
    console.log("received draw event");
    if (data === "") return;
    const parsedData = JSON.parse(data);
    setDrawData({ ...parsedData });
  };

  const handleBoardUpdate = (data: string) => {
    socket.current?.emit("draw", data);
  };

  return (
    <Container fluid={true} className="mt-5">
      <div className="row">
        <div className="col-sm-2">
          <h3>
            Participanti{" "}
            <span>
              {isConnected ? (
                <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />
              ) : (
                <FontAwesomeIcon icon={faBan} style={{ color: "red" }} />
              )}
            </span>
          </h3>
          <ul>
            {participants.map((participant, idx) => (
              <li key={idx}>{participant?.profile?.nume}</li>
            ))}
          </ul>
        </div>
        <div className="col-sm-10">
          <Whiteboard data={drawData} onUpdate={handleBoardUpdate} />
        </div>
      </div>
    </Container>
  );
}
