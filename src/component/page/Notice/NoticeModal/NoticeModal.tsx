import { ChangeEvent, FC, useEffect, useRef, useState } from 'react';
import { NoticeModalStyled } from './styled';
import { useRecoilState } from 'recoil';
import { modalState } from '../../../../stores/modalState';
import { loginInfoState } from '../../../../stores/userInfo';
import { ILoginInfo } from '../../../../models/interface/store/userInfo';
import { IDetailResponse, INoticeDetail, IPostResponse } from '../../../../models/interface/INotice';
import { postNoticeApi } from '../../../../api/postNoticeApi';
import { Notice } from '../../../../api/api';
import axios, { AxiosResponse } from 'axios';

interface INoticeModalProps {
    onSuccess: () => void;
    noticeSeq: number;
    setNoticeSeq: (noticeSeq: number) => void;
}

export const NoticeModal: FC<INoticeModalProps> = ({ onSuccess, noticeSeq, setNoticeSeq }) => {
    const [modal, setModal] = useRecoilState<boolean>(modalState);
    const [userInfo] = useRecoilState<ILoginInfo>(loginInfoState);
    const [noticeDetail, setNoticeDetail] = useState<INoticeDetail>();
    const [imageUrl, setImageUrl] = useState<string>();
    const [fileData, setFileData] = useState<File>();
    // const [seq, setSeq] = useState<number>(noticeSeq);
    const title = useRef<HTMLInputElement>();
    const context = useRef<HTMLInputElement>();

    // 라이프사이클 훅
    useEffect(() => {
        noticeSeq && searchDetail(); // 컴포넌트 열릴 때 바로
        
        return () => {     // 컴포넌트 닫히기 직전
            noticeSeq && setNoticeSeq(undefined);
            // setNoticeSeq(undefined);
        };
    }, []);

    const searchDetail = async () => {
        const detail = await postNoticeApi<IDetailResponse>(Notice.getDetail, { noticeSeq });

        if (detail){
            setNoticeDetail(detail.detail);
            const { fileExt, logicalPath } = detail.detail;  // 타입스크립트 기능
            
            if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {
                setImageUrl(logicalPath);
            } else {
                setImageUrl('');
            }

            console.log(logicalPath);
        }
    };

    const handlerModal = () => {
        setModal(!modal);
    };

    // const handlerSave = async () => {
    //     const param = {
    //         title: title.current.value,
    //         context: context.current.value,
    //         loginId: userInfo.loginId,
    //     };

    //     const getSave = await postNoticeApi<IPostResponse>(Notice.getSave, param);

    //     if (getSave.result === 'success') {
    //         onSuccess();
    //     }
    // };

    const handlerFileSave = () => {
        const fileForm = new FormData();
        const textData = {
            title: title.current.value,
            context: context.current.value,
            loginId: userInfo.loginId,
        };
        fileData && fileForm.append('file', fileData);
        fileForm.append('text', new Blob([JSON.stringify(textData)], { type: 'application/json' })); // 바이너리 데이터

        axios.post('/board/noticeSaveFileForm.do', fileForm).then((res: AxiosResponse<IPostResponse>) => {
            res.data.result === 'success' && onSuccess();
        });
    }

    // const handlerUpdate = async () => {
    //     const param = {
    //         title: title.current.value,
    //         context: context.current.value,
    //         noticeSeq,
    //     };

    //     const getUpdate = await postNoticeApi<IPostResponse>(Notice.getUpdate, param);
        
    //     if (getUpdate.result === 'success') {
    //         onSuccess();
    //     }
    // }

    const handlerFileUpdate = () => {
        const fileForm = new FormData();
        const textData = {
            title: title.current.value,
            context: context.current.value,
            noticeSeq,
        };
        fileData && fileForm.append('file', fileData);
        fileForm.append('text', new Blob([JSON.stringify(textData)], { type: 'application/json' }));

        axios.post('/board/noticeUpdateFileForm.do', fileForm).then((res: AxiosResponse<IPostResponse>) => {
            res.data.result === 'success' && onSuccess();
        });
    }

    const handlerDelete = async () => {
        const getDelete = await postNoticeApi<IPostResponse>(Notice.getDelete, { noticeSeq });

        if (getDelete.result === 'success') {
            onSuccess();
        }

        // axios.post('/board/noticeDeleteBody.do', { noticeSeq }).then((res: AxiosResponse<IPostResponse>) => {
        //     res.data.result === 'success' && onSuccess();
        // });
    }

    const handlerFile = (e: ChangeEvent<HTMLInputElement>) => {
        const fileInfo = e.target.files;
        console.log(fileInfo);
        if (fileInfo?.length > 0) {
            const fileInfoSplit = fileInfo[0].name.split('.');
            const fileExtension = fileInfoSplit[1].toLowerCase();

            if (fileExtension === 'jpg' || fileExtension === 'gif' || fileExtension === 'png') {
                setImageUrl(URL.createObjectURL(fileInfo[0]));
            } else {
                setImageUrl('');
            }

            setFileData(fileInfo[0]);
        }
    };


    return (
        <NoticeModalStyled>
            <div className="container">
                <label>
                    제목 :<input type="text" ref={title} defaultValue={noticeDetail?.title}></input>
                </label>
                <label>
                    내용 : <input type="text" ref={context} defaultValue={noticeDetail?.content}></input>
                </label>
                파일 :<input type="file" id="fileInput" style={{ display: 'none' }} onChange={handlerFile}></input>
                <label className="img-label" htmlFor="fileInput">
                    파일 첨부하기
                </label>
                <div>
                    {imageUrl ? <div> 
                        <label>미리보기</label>
                        <img src={imageUrl} />
                        {fileData?.name || noticeDetail.fileName}
                    </div> : <div></div>}
                    
                </div>
                <div className={'button-container'}>
                    <button onClick={noticeSeq ? handlerFileUpdate : handlerFileSave }>{noticeSeq ? '수정' : '등록'}</button>
                    {noticeSeq && <button onClick={handlerDelete}>삭제</button>}
                    <button onClick={handlerModal}>나가기</button>
                </div>
            </div>
        </NoticeModalStyled>
    );
};
