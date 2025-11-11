import axiosLayer from './axiosLayer';   // axios instance WITHOUT token


export const postDisqualified = async (filePath: string) => {
  const rs = await axiosLayer.post(
    "/video/disqualified",
    { path: filePath }, // request body
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return rs.data;
};

export const renameFileMoveToDone = async (filePath: string, name: string, angle: number) => {

  const rs = await axiosLayer.post(
    "/video/rename-done",
    {
      path: filePath,
      newName: name,
      rotateAngle: angle,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return rs.data;
};

